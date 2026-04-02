"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) throw new Error("Unauthorized");
  return session;
}

function paths(clientId: string) {
  revalidatePath(`/admin/clients/${clientId}/analytics`);
  revalidatePath(`/analytics`);
}

export type GridRowInput = {
  id: string | null;
  metricId: string;
  date: string; // YYYY-MM-DD
  value: number;
  notes: string;
};

export async function saveGridRows(clientId: string, rows: GridRowInput[]) {
  const session = await requireAdmin();

  if (rows.length === 0) return { success: true, saved: 0 };

  // Validate all metricIds belong to this client
  const metricIds = [...new Set(rows.map((r) => r.metricId).filter(Boolean))];
  const validMetrics = await prisma.clientMetric.findMany({
    where: { id: { in: metricIds }, clientId },
    select: { id: true },
  });
  const validSet = new Set(validMetrics.map((m) => m.id));

  const valid = rows.filter(
    (r) => validSet.has(r.metricId) && r.date && r.value != null && !isNaN(r.value)
  );

  const toCreate = valid.filter((r) => !r.id);
  const toUpdate = valid.filter((r) => !!r.id);

  await prisma.$transaction([
    ...toUpdate.map((r) =>
      prisma.clientMetricDataPoint.update({
        where: { id: r.id! },
        data: {
          date: new Date(r.date),
          value: r.value,
          notes: r.notes || null,
        },
      })
    ),
    ...(toCreate.length > 0
      ? [
          prisma.clientMetricDataPoint.createMany({
            data: toCreate.map((r) => ({
              metricId: r.metricId,
              date: new Date(r.date),
              value: r.value,
              notes: r.notes || null,
              createdById: session.user.id,
            })),
          }),
        ]
      : []),
  ]);

  paths(clientId);
  return { success: true, saved: valid.length };
}

export async function deleteGridRows(clientId: string, ids: string[]) {
  await requireAdmin();

  if (ids.length === 0) return { success: true };

  await prisma.clientMetricDataPoint.deleteMany({
    where: {
      id: { in: ids },
      metric: { clientId },
    },
  });

  paths(clientId);
  return { success: true };
}
