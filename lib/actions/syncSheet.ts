"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";
import { fetchSheetRows } from "@/lib/google-sheets";
import { transformSheetRows } from "@/lib/sheet-transform";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function syncGoogleSheet(
  clientId: string
): Promise<{ success: true; count: number } | { error: string }> {
  const session = await requireAdmin();

  const config = await prisma.googleSheetConfig.findUnique({
    where: { clientId },
  });

  if (!config) return { error: "No Google Sheet is configured for this client." };

  try {
    // ── 1. Fetch rows ───────────────────────────────────────
    const rows = await fetchSheetRows(
      config.spreadsheetId,
      config.sheetName,
      config.range
    );

    // ── 2. Transform ────────────────────────────────────────
    const dataPoints = transformSheetRows(rows);

    if (dataPoints.length === 0) {
      await prisma.googleSheetConfig.update({
        where: { clientId },
        data: {
          lastSyncedAt: new Date(),
          lastSyncError:
            "No valid data rows found. Check that your sheet has a Date column and at least one recognised metric column.",
          syncedRowCount: 0,
        },
      });
      return {
        error:
          "No valid data rows found. Verify your sheet has a Date column and recognised metric headers.",
      };
    }

    // ── 3. Upsert into AnalyticsDataPoint ───────────────────
    // Strategy: delete all previously synced GOOGLE_SHEET points for this
    // client and re-insert. Manual points are untouched.
    await prisma.$transaction([
      prisma.analyticsDataPoint.deleteMany({
        where: { clientId, source: "GOOGLE_SHEET" },
      }),
      prisma.analyticsDataPoint.createMany({
        data: dataPoints.map((dp) => ({
          clientId,
          metricType: dp.metricType,
          date: dp.date,
          value: dp.value,
          source: "GOOGLE_SHEET" as const,
          createdById: session.user.id,
        })),
      }),
    ]);

    // ── 4. Update sync metadata ─────────────────────────────
    await prisma.googleSheetConfig.update({
      where: { clientId },
      data: {
        lastSyncedAt: new Date(),
        lastSyncError: null,
        syncedRowCount: dataPoints.length,
      },
    });

    revalidatePath(`/analytics`);
    revalidatePath(`/admin/clients/${clientId}/analytics`);

    return { success: true, count: dataPoints.length };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";

    // Persist the error so the admin can see it without re-triggering.
    await prisma.googleSheetConfig.update({
      where: { clientId },
      data: { lastSyncError: message },
    }).catch(() => {/* ignore secondary write failures */});

    return { error: message };
  }
}
