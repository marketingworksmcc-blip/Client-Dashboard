"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { ExternalApiAuthType, Prisma } from "@prisma/client";

export interface ApiFieldMapping {
  apiField: string; // dot-path into the API response, e.g. "data.sessions"
  metricId: string;
}

export interface ExternalApiConfigInput {
  enabled: boolean;
  apiUrl: string;
  authType: ExternalApiAuthType;
  apiKey?: string;
  headerName?: string;
  mappings: ApiFieldMapping[];
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) throw new Error("Unauthorized");
  return session;
}

/** Resolve a dot-path like "data.sessions" from an object. */
function resolvePath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((cur, key) => {
    if (cur !== null && typeof cur === "object") {
      return (cur as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function buildHeaders(
  authType: ExternalApiAuthType,
  apiKey?: string | null,
  headerName?: string | null
): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authType === "BEARER" && apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  } else if (authType === "API_KEY_HEADER" && apiKey && headerName) {
    headers[headerName] = apiKey;
  }
  return headers;
}

export async function saveExternalApiConfig(clientId: string, data: ExternalApiConfigInput) {
  await requireAdmin();

  const mappings = data.mappings as unknown as Prisma.InputJsonValue;
  const base = {
    enabled: data.enabled,
    apiUrl: data.apiUrl,
    authType: data.authType,
    apiKey: data.apiKey ?? null,
    headerName: data.headerName ?? null,
    mappings,
  };

  await prisma.externalMetricApi.upsert({
    where: { clientId },
    create: { clientId, ...base },
    update: base,
  });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
  return { success: true };
}

export async function testExternalApiConnection(
  apiUrl: string,
  authType: ExternalApiAuthType,
  apiKey?: string,
  headerName?: string
): Promise<{ ok: boolean; preview?: unknown; error?: string }> {
  await requireAdmin();

  try {
    const res = await fetch(apiUrl, {
      headers: buildHeaders(authType, apiKey, headerName),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    const json = await res.json();
    return { ok: true, preview: json };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Request failed" };
  }
}

export async function syncExternalApi(clientId: string): Promise<{ ok: boolean; synced: number; error?: string }> {
  const session = await requireAdmin();

  const config = await prisma.externalMetricApi.findUnique({ where: { clientId } });
  if (!config || !config.enabled) return { ok: false, synced: 0, error: "External API not configured or disabled." };

  try {
    const res = await fetch(config.apiUrl, {
      headers: buildHeaders(config.authType, config.apiKey, config.headerName),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const errMsg = `HTTP ${res.status}: ${text.slice(0, 200)}`;
      await prisma.externalMetricApi.update({
        where: { clientId },
        data: { lastSyncError: errMsg },
      });
      return { ok: false, synced: 0, error: errMsg };
    }

    const json = await res.json();
    const mappings = config.mappings as unknown as ApiFieldMapping[];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let synced = 0;

    for (const mapping of mappings) {
      if (!mapping.metricId || !mapping.apiField) continue;

      const raw = resolvePath(json, mapping.apiField);
      const value = Number(raw);
      if (isNaN(value)) continue;

      await prisma.clientMetricDataPoint.upsert({
        where: {
          // Use a compound unique — we'll add one below if it doesn't exist.
          // For now, check for existing entry with same metric+date and upsert manually.
          id: (
            await prisma.clientMetricDataPoint.findFirst({
              where: { metricId: mapping.metricId, date: today },
              select: { id: true },
            })
          )?.id ?? "nonexistent",
        },
        create: {
          metricId: mapping.metricId,
          date: today,
          value,
          source: "MANUAL",
          createdById: session.user.id,
        },
        update: { value },
      });

      synced++;
    }

    await prisma.externalMetricApi.update({
      where: { clientId },
      data: { lastSyncedAt: new Date(), lastSyncError: null },
    });

    revalidatePath(`/admin/clients/${clientId}/analytics`);
    return { ok: true, synced };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Sync failed";
    await prisma.externalMetricApi.update({
      where: { clientId },
      data: { lastSyncError: errMsg },
    });
    return { ok: false, synced: 0, error: errMsg };
  }
}
