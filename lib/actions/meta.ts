"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

const META_API_VERSION = "v19.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

export interface MetaMetricMapping {
  metaMetric: string;
  metricId: string;
}

export interface CampaignDataPoint {
  campaign: string;
  value: number;
}

export interface MetaConfigInput {
  enabled: boolean;
  adAccountId: string;
  accessToken: string;
  mappings: MetaMetricMapping[];
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) throw new Error("Unauthorized");
  return session;
}

function normalizeAccountId(id: string): string {
  const clean = id.trim().replace(/^act_/, "");
  return `act_${clean}`;
}

// ── Public actions ─────────────────────────────────────────────

export async function saveMetaConfig(clientId: string, data: MetaConfigInput) {
  await requireAdmin();

  const base = {
    enabled: data.enabled,
    adAccountId: data.adAccountId.trim().replace(/^act_/, ""),
    accessToken: data.accessToken.trim(),
    mappings: data.mappings as unknown as Prisma.InputJsonValue,
  };

  await prisma.metaConfig.upsert({
    where: { clientId },
    create: { clientId, ...base },
    update: base,
  });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
  return { success: true };
}

export async function testMetaConnection(
  adAccountId: string,
  accessToken: string
): Promise<{ ok: boolean; accountName?: string; error?: string }> {
  await requireAdmin();

  try {
    const accountId = normalizeAccountId(adAccountId);
    const url = new URL(`${META_BASE}/${accountId}`);
    url.searchParams.set("fields", "name,account_status");
    url.searchParams.set("access_token", accessToken.trim());

    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = (await res.json()) as { name?: string; account_status?: number; error?: { message: string } };

    if (!res.ok || json.error) {
      return { ok: false, error: json.error?.message ?? `HTTP ${res.status}` };
    }

    return { ok: true, accountName: json.name };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Connection failed." };
  }
}

export async function syncMeta(clientId: string): Promise<{ ok: boolean; synced: number; error?: string }> {
  const session = await requireAdmin();

  const config = await prisma.metaConfig.findUnique({ where: { clientId } });
  if (!config?.enabled) return { ok: false, synced: 0, error: "Meta Ads not configured or disabled." };

  const mappings = config.mappings as unknown as MetaMetricMapping[];
  if (!mappings.length) return { ok: false, synced: 0, error: "No metric mappings configured." };

  try {
    const accountId = normalizeAccountId(config.adAccountId);
    const metricFields = [...new Set(mappings.map((m) => m.metaMetric))].join(",");

    // ── 1. Sync time-series metrics (daily for last 30 days) ──
    const insightsUrl = new URL(`${META_BASE}/${accountId}/insights`);
    insightsUrl.searchParams.set("fields", `date_start,${metricFields}`);
    insightsUrl.searchParams.set("time_increment", "1");
    insightsUrl.searchParams.set("date_preset", "last_30_days");
    insightsUrl.searchParams.set("access_token", config.accessToken);

    const insightsRes = await fetch(insightsUrl.toString(), { cache: "no-store" });
    const insightsJson = (await insightsRes.json()) as {
      data?: Record<string, string>[];
      error?: { message: string };
    };

    if (!insightsRes.ok || insightsJson.error) {
      const errMsg = insightsJson.error?.message ?? `HTTP ${insightsRes.status}`;
      await prisma.metaConfig.update({ where: { clientId }, data: { lastSyncError: errMsg } });
      return { ok: false, synced: 0, error: errMsg };
    }

    const rows = insightsJson.data ?? [];
    let synced = 0;

    for (const row of rows) {
      const rawDate = row["date_start"];
      if (!rawDate) continue;
      const dateObj = new Date(`${rawDate}T00:00:00.000Z`);

      for (const mapping of mappings) {
        if (!mapping.metricId || !mapping.metaMetric) continue;

        const raw = row[mapping.metaMetric];
        const value = Number(raw);
        if (raw === undefined || raw === null || isNaN(value)) continue;

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

    // ── 2. Sync campaign breakdown (spend by campaign) ────────
    const campaignUrl = new URL(`${META_BASE}/${accountId}/insights`);
    campaignUrl.searchParams.set("fields", "campaign_name,spend");
    campaignUrl.searchParams.set("level", "campaign");
    campaignUrl.searchParams.set("date_preset", "last_30_days");
    campaignUrl.searchParams.set("sort", "spend_descending");
    campaignUrl.searchParams.set("limit", "10");
    campaignUrl.searchParams.set("access_token", config.accessToken);

    const campaignRes = await fetch(campaignUrl.toString(), { cache: "no-store" });
    const campaignJson = (await campaignRes.json()) as {
      data?: { campaign_name: string; spend: string }[];
    };

    const campaignData: CampaignDataPoint[] = (campaignJson.data ?? [])
      .map((c) => ({ campaign: c.campaign_name, value: Number(c.spend) }))
      .filter((c) => c.value > 0);

    await prisma.metaConfig.update({
      where: { clientId },
      data: {
        lastSyncedAt: new Date(),
        lastSyncError: null,
        campaignData: campaignData as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/admin/clients/${clientId}/analytics`);
    return { ok: true, synced };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Sync failed";
    await prisma.metaConfig.update({ where: { clientId }, data: { lastSyncError: errMsg } });
    return { ok: false, synced: 0, error: errMsg };
  }
}
