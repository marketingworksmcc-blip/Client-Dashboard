"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { MICRO_FIELDS } from "@/lib/google-ads-metrics";

const ADS_API_VERSION = "v17";
const ADS_BASE = `https://googleads.googleapis.com/${ADS_API_VERSION}`;

export interface GoogleAdsMetricMapping {
  adsMetric: string;
  metricId: string;
}

export interface AdsCampaignDataPoint {
  campaign: string;
  value: number;
}

export interface GoogleAdsConfigInput {
  enabled: boolean;
  customerId: string;
  developerToken: string;
  serviceAccountJson: string;
  mappings: GoogleAdsMetricMapping[];
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) throw new Error("Unauthorized");
  return session;
}

function normalizeCustomerId(id: string): string {
  return id.replace(/-/g, "").trim();
}

// ── JWT helpers (same RS256 pattern as GA4) ────────────────────

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
      scope: "https://www.googleapis.com/auth/adwords",
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

function adsHeaders(token: string, developerToken: string, customerId: string) {
  return {
    Authorization: `Bearer ${token}`,
    "developer-token": developerToken,
    "login-customer-id": customerId,
    "Content-Type": "application/json",
  };
}

/** Extract a nested field value from a Google Ads result row using dot-path (e.g. "metrics.clicks") */
function extractField(row: Record<string, unknown>, metricKey: string): number {
  // metricKey is like "metrics.cost_micros" — maps to row.metrics.costMicros in camelCase
  const [section, ...rest] = metricKey.split(".");
  const camelKey = rest
    .join("_")
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  const sectionObj = row[section] as Record<string, unknown> | undefined;
  const raw = sectionObj?.[camelKey];
  let value = Number(raw ?? 0);
  if (MICRO_FIELDS.has(metricKey)) value = value / 1_000_000;
  return value;
}

// ── Public actions ─────────────────────────────────────────────

export async function saveGoogleAdsConfig(clientId: string, data: GoogleAdsConfigInput) {
  await requireAdmin();

  const base = {
    enabled: data.enabled,
    customerId: normalizeCustomerId(data.customerId),
    developerToken: data.developerToken.trim(),
    serviceAccountJson: data.serviceAccountJson.trim(),
    mappings: data.mappings as unknown as Prisma.InputJsonValue,
  };

  await prisma.googleAdsConfig.upsert({
    where: { clientId },
    create: { clientId, ...base },
    update: base,
  });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
  return { success: true };
}

export async function testGoogleAdsConnection(
  customerId: string,
  developerToken: string,
  serviceAccountJson: string
): Promise<{ ok: boolean; accountName?: string; error?: string }> {
  await requireAdmin();

  try {
    const cid = normalizeCustomerId(customerId);
    const token = await getAccessToken(serviceAccountJson);

    const res = await fetch(`${ADS_BASE}/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers: adsHeaders(token, developerToken, cid),
      body: JSON.stringify({ query: "SELECT customer.descriptive_name FROM customer LIMIT 1" }),
      cache: "no-store",
    });

    const json = (await res.json()) as {
      results?: { customer?: { descriptiveName?: string } }[];
      error?: { message: string };
    };

    if (!res.ok || json.error) {
      return { ok: false, error: json.error?.message ?? `HTTP ${res.status}` };
    }

    const name = json.results?.[0]?.customer?.descriptiveName;
    return { ok: true, accountName: name };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Connection failed." };
  }
}

export async function syncGoogleAds(clientId: string): Promise<{ ok: boolean; synced: number; error?: string }> {
  const session = await requireAdmin();

  const config = await prisma.googleAdsConfig.findUnique({ where: { clientId } });
  if (!config?.enabled) return { ok: false, synced: 0, error: "Google Ads not configured or disabled." };

  const mappings = config.mappings as unknown as GoogleAdsMetricMapping[];
  if (!mappings.length) return { ok: false, synced: 0, error: "No metric mappings configured." };

  try {
    const cid = normalizeCustomerId(config.customerId);
    const token = await getAccessToken(config.serviceAccountJson);
    const headers = adsHeaders(token, config.developerToken, cid);

    // Build SELECT clause from unique metric fields
    const uniqueMetrics = [...new Set(mappings.map((m) => m.adsMetric))];
    const selectFields = ["segments.date", ...uniqueMetrics].join(", ");

    // ── 1. Time-series: daily for last 30 days ────────────────
    const metricsRes = await fetch(`${ADS_BASE}/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: `SELECT ${selectFields} FROM customer WHERE segments.date DURING LAST_30_DAYS ORDER BY segments.date ASC`,
      }),
      cache: "no-store",
    });

    const metricsJson = (await metricsRes.json()) as {
      results?: Record<string, unknown>[];
      error?: { message: string };
    };

    if (!metricsRes.ok || metricsJson.error) {
      const errMsg = metricsJson.error?.message ?? `HTTP ${metricsRes.status}`;
      await prisma.googleAdsConfig.update({ where: { clientId }, data: { lastSyncError: errMsg } });
      return { ok: false, synced: 0, error: errMsg };
    }

    const rows = metricsJson.results ?? [];
    let synced = 0;

    for (const row of rows) {
      const segments = row.segments as { date?: string } | undefined;
      const rawDate = segments?.date;
      if (!rawDate) continue;
      const dateObj = new Date(`${rawDate}T00:00:00.000Z`);

      for (const mapping of mappings) {
        if (!mapping.metricId || !mapping.adsMetric) continue;

        const value = extractField(row, mapping.adsMetric);
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

    // ── 2. Campaign spend breakdown ────────────────────────────
    const campaignRes = await fetch(`${ADS_BASE}/customers/${cid}/googleAds:search`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query:
          "SELECT campaign.name, metrics.cost_micros FROM campaign WHERE segments.date DURING LAST_30_DAYS AND campaign.status = 'ENABLED' ORDER BY metrics.cost_micros DESC LIMIT 10",
      }),
      cache: "no-store",
    });

    const campaignJson = (await campaignRes.json()) as {
      results?: { campaign?: { name?: string }; metrics?: { costMicros?: string } }[];
    };

    const campaignData: AdsCampaignDataPoint[] = (campaignJson.results ?? [])
      .map((r) => ({
        campaign: r.campaign?.name ?? "(unknown)",
        value: Number(r.metrics?.costMicros ?? 0) / 1_000_000,
      }))
      .filter((c) => c.value > 0);

    await prisma.googleAdsConfig.update({
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
    await prisma.googleAdsConfig.update({ where: { clientId }, data: { lastSyncError: errMsg } });
    return { ok: false, synced: 0, error: errMsg };
  }
}
