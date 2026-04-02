"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

const FUNNEL_API_BASE = "https://api.funnel.io/v1";

export interface FunnelMetricMapping {
  funnelMetric: string;
  metricId: string;
}

export interface FunnelChannelDataPoint {
  channel: string;
  value: number;
}

export interface FunnelConfigInput {
  enabled: boolean;
  apiKey: string;
  accountId: string;
  mappings: FunnelMetricMapping[];
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) throw new Error("Unauthorized");
  return session;
}

function funnelHeaders(apiKey: string) {
  return {
    Authorization: `Token ${apiKey}`,
    "Content-Type": "application/json",
  };
}

// ── Public actions ─────────────────────────────────────────────

export async function saveFunnelConfig(clientId: string, data: FunnelConfigInput) {
  await requireAdmin();

  const base = {
    enabled: data.enabled,
    apiKey: data.apiKey.trim(),
    accountId: data.accountId.trim(),
    mappings: data.mappings as unknown as Prisma.InputJsonValue,
  };

  await prisma.funnelConfig.upsert({
    where: { clientId },
    create: { clientId, ...base },
    update: base,
  });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
  return { success: true };
}

export async function testFunnelConnection(
  apiKey: string,
  accountId: string
): Promise<{ ok: boolean; accountName?: string; error?: string }> {
  await requireAdmin();

  try {
    const res = await fetch(`${FUNNEL_API_BASE}/accounts/${accountId.trim()}`, {
      method: "GET",
      headers: funnelHeaders(apiKey.trim()),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let message: string;
      try {
        const json = JSON.parse(text) as { error?: string; message?: string };
        message = json.error ?? json.message ?? `HTTP ${res.status}`;
      } catch {
        message = `HTTP ${res.status}`;
      }
      return { ok: false, error: message };
    }

    const json = (await res.json()) as { name?: string; id?: string };
    return { ok: true, accountName: json.name ?? accountId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Connection failed." };
  }
}

export async function syncFunnel(
  clientId: string
): Promise<{ ok: boolean; synced: number; error?: string }> {
  const session = await requireAdmin();

  const config = await prisma.funnelConfig.findUnique({ where: { clientId } });
  if (!config?.enabled) return { ok: false, synced: 0, error: "Funnel.io not configured or disabled." };

  const mappings = config.mappings as unknown as FunnelMetricMapping[];
  if (!mappings.length) return { ok: false, synced: 0, error: "No metric mappings configured." };

  try {
    const headers = funnelHeaders(config.apiKey);
    const accountId = config.accountId.trim();

    // Build date range: last 30 days
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1); // yesterday to avoid partial-day data
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 29);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // Unique metric fields to request
    const uniqueMetrics = [...new Set(mappings.map((m) => m.funnelMetric))];

    // ── 1. Time-series: daily breakdown ────────────────────────
    const metricsRes = await fetch(`${FUNNEL_API_BASE}/accounts/${accountId}/data`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        start_date: fmt(startDate),
        end_date: fmt(endDate),
        dimensions: ["date"],
        metrics: uniqueMetrics,
        granularity: "day",
      }),
      cache: "no-store",
    });

    if (!metricsRes.ok) {
      const text = await metricsRes.text().catch(() => "");
      let errMsg: string;
      try {
        const json = JSON.parse(text) as { error?: string; message?: string };
        errMsg = json.error ?? json.message ?? `HTTP ${metricsRes.status}`;
      } catch {
        errMsg = `HTTP ${metricsRes.status}`;
      }
      await prisma.funnelConfig.update({ where: { clientId }, data: { lastSyncError: errMsg } });
      return { ok: false, synced: 0, error: errMsg };
    }

    const metricsJson = (await metricsRes.json()) as {
      data?: { date: string; [metric: string]: string | number }[];
    };

    const rows = metricsJson.data ?? [];
    let synced = 0;

    for (const row of rows) {
      if (!row.date) continue;
      const dateObj = new Date(`${row.date}T00:00:00.000Z`);

      for (const mapping of mappings) {
        if (!mapping.metricId || !mapping.funnelMetric) continue;

        const raw = row[mapping.funnelMetric];
        const value = Number(raw ?? 0);
        if (isNaN(value)) continue;

        const existing = await prisma.clientMetricDataPoint.findFirst({
          where: { metricId: mapping.metricId, date: dateObj },
          select: { id: true },
        });

        await prisma.clientMetricDataPoint.upsert({
          where: { id: existing?.id ?? "nonexistent" },
          create: {
            metricId: mapping.metricId,
            date: dateObj,
            value,
            source: "MANUAL",
            createdById: session.user.id,
          },
          update: { value },
        });

        synced++;
      }
    }

    // ── 2. Channel spend breakdown ─────────────────────────────
    const channelRes = await fetch(`${FUNNEL_API_BASE}/accounts/${accountId}/data`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        start_date: fmt(startDate),
        end_date: fmt(endDate),
        dimensions: ["channel"],
        metrics: ["cost"],
        granularity: "total",
      }),
      cache: "no-store",
    });

    let channelData: FunnelChannelDataPoint[] = [];
    if (channelRes.ok) {
      const channelJson = (await channelRes.json()) as {
        data?: { channel?: string; cost?: number | string }[];
      };
      channelData = (channelJson.data ?? [])
        .map((r) => ({
          channel: r.channel ?? "(unknown)",
          value: Number(r.cost ?? 0),
        }))
        .filter((c) => c.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    }

    await prisma.funnelConfig.update({
      where: { clientId },
      data: {
        lastSyncedAt: new Date(),
        lastSyncError: null,
        channelData: channelData as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/admin/clients/${clientId}/analytics`);
    return { ok: true, synced };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Sync failed";
    await prisma.funnelConfig.update({ where: { clientId }, data: { lastSyncError: errMsg } });
    return { ok: false, synced: 0, error: errMsg };
  }
}
