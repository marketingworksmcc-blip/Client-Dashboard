"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

export interface GA4MetricMapping {
  ga4Metric: string;
  metricId: string;
}

export interface KeyEventSource {
  source: string;
  value: number;
}

export interface GA4ConfigInput {
  enabled: boolean;
  propertyId: string;
  serviceAccountJson: string;
  mappings: GA4MetricMapping[];
  keyEventName?: string;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) throw new Error("Unauthorized");
  return session;
}

// ── JWT / token helpers ────────────────────────────────────────

function base64url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function createJWT(clientEmail: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );
  const signingInput = `${header}.${payload}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign
    .sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `${signingInput}.${signature}`;
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  let sa: { client_email: string; private_key: string };
  try {
    sa = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error("Invalid service account JSON.");
  }
  if (!sa.client_email || !sa.private_key) {
    throw new Error("Service account JSON missing client_email or private_key.");
  }

  const jwt = createJWT(sa.client_email, sa.private_key);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("No access_token returned by Google.");
  return data.access_token;
}

async function fetchKeyEventsBySource(
  token: string,
  propertyId: string,
  keyEventName: string
): Promise<KeyEventSource[]> {
  const metricName = `keyEvents:${keyEventName}`;

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: metricName }],
        orderBys: [{ metric: { metricName }, desc: true }],
        limit: 10,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) return [];

  const data = (await res.json()) as {
    rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
  };

  return (data.rows ?? [])
    .map((row) => ({
      source: row.dimensionValues[0]?.value ?? "(unknown)",
      value: Number(row.metricValues[0]?.value ?? 0),
    }))
    .filter((r) => r.value > 0);
}

// ── Public actions ─────────────────────────────────────────────

export async function saveGA4Config(clientId: string, data: GA4ConfigInput) {
  await requireAdmin();

  const base = {
    enabled: data.enabled,
    propertyId: data.propertyId.trim(),
    serviceAccountJson: data.serviceAccountJson.trim(),
    mappings: data.mappings as unknown as Prisma.InputJsonValue,
    keyEventName: data.keyEventName?.trim() || null,
  };

  await prisma.gA4Config.upsert({
    where: { clientId },
    create: { clientId, ...base },
    update: base,
  });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
  return { success: true };
}

export async function testGA4Connection(
  propertyId: string,
  serviceAccountJson: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  try {
    const token = await getAccessToken(serviceAccountJson);

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId.trim()}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "7daysAgo", endDate: "yesterday" }],
          metrics: [{ name: "sessions" }],
        }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `GA4 API error (${res.status}): ${text.slice(0, 300)}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Connection failed." };
  }
}

export async function syncGA4(clientId: string): Promise<{ ok: boolean; synced: number; error?: string }> {
  const session = await requireAdmin();

  const config = await prisma.gA4Config.findUnique({ where: { clientId } });
  if (!config?.enabled) return { ok: false, synced: 0, error: "GA4 not configured or disabled." };

  const mappings = config.mappings as unknown as GA4MetricMapping[];
  if (!mappings.length) return { ok: false, synced: 0, error: "No metric mappings configured." };

  try {
    const token = await getAccessToken(config.serviceAccountJson);

    // ── 1. Sync time-series metrics ───────────────────────────
    const metricsRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${config.propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
          dimensions: [{ name: "date" }],
          metrics: mappings.map((m) => ({ name: m.ga4Metric })),
          orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        }),
        cache: "no-store",
      }
    );

    if (!metricsRes.ok) {
      const text = await metricsRes.text().catch(() => "");
      const errMsg = `GA4 API error (${metricsRes.status}): ${text.slice(0, 300)}`;
      await prisma.gA4Config.update({ where: { clientId }, data: { lastSyncError: errMsg } });
      return { ok: false, synced: 0, error: errMsg };
    }

    const metricsData = (await metricsRes.json()) as {
      metricHeaders?: { name: string }[];
      rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[];
    };

    const metricHeaders = metricsData.metricHeaders ?? [];
    const rows = metricsData.rows ?? [];
    let synced = 0;

    for (const row of rows) {
      const rawDate = row.dimensionValues?.[0]?.value ?? "";
      if (rawDate.length !== 8) continue;
      const dateObj = new Date(
        `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}T00:00:00.000Z`
      );

      for (const mapping of mappings) {
        if (!mapping.metricId || !mapping.ga4Metric) continue;

        const headerIndex = metricHeaders.findIndex((h) => h.name === mapping.ga4Metric);
        if (headerIndex === -1) continue;

        const raw = row.metricValues[headerIndex]?.value;
        const value = Number(raw);
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

    // ── 2. Sync key events by source (if configured) ──────────
    let keyEventsData: KeyEventSource[] = [];
    if (config.keyEventName) {
      keyEventsData = await fetchKeyEventsBySource(token, config.propertyId, config.keyEventName);
    }

    await prisma.gA4Config.update({
      where: { clientId },
      data: {
        lastSyncedAt: new Date(),
        lastSyncError: null,
        keyEventsData: keyEventsData as unknown as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/admin/clients/${clientId}/analytics`);
    return { ok: true, synced };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Sync failed";
    await prisma.gA4Config.update({ where: { clientId }, data: { lastSyncError: errMsg } });
    return { ok: false, synced: 0, error: errMsg };
  }
}
