"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AnalyticsMode } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

// ── Analytics mode ────────────────────────────────────────────

export async function setAnalyticsMode(clientId: string, mode: AnalyticsMode) {
  await requireAdmin();

  await prisma.client.update({
    where: { id: clientId },
    data: { analyticsMode: mode },
  });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
  revalidatePath(`/analytics`);
}

// ── Google Sheet config ───────────────────────────────────────

const sheetConfigSchema = z.object({
  spreadsheetId: z.string().min(1, "Spreadsheet ID is required"),
  sheetName: z.string().min(1, "Sheet name is required"),
  range: z.string().optional(),
});

export async function saveGoogleSheetConfig(
  clientId: string,
  prevState: unknown,
  formData: FormData
) {
  await requireAdmin();

  const raw = {
    spreadsheetId: (formData.get("spreadsheetId") as string)?.trim(),
    sheetName: (formData.get("sheetName") as string)?.trim() || "Sheet1",
    range: (formData.get("range") as string)?.trim() || undefined,
  };

  const parsed = sheetConfigSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.googleSheetConfig.upsert({
    where: { clientId },
    create: {
      clientId,
      spreadsheetId: parsed.data.spreadsheetId,
      sheetName: parsed.data.sheetName,
      range: parsed.data.range ?? null,
    },
    update: {
      spreadsheetId: parsed.data.spreadsheetId,
      sheetName: parsed.data.sheetName,
      range: parsed.data.range ?? null,
      // Clear stale sync status when config changes.
      lastSyncedAt: null,
      lastSyncError: null,
      syncedRowCount: null,
    },
  });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
  return { success: true };
}

export async function deleteGoogleSheetConfig(clientId: string) {
  await requireAdmin();

  await prisma.googleSheetConfig.deleteMany({ where: { clientId } });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
}
