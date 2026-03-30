"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageClients } from "@/lib/permissions";
import type { MetricType } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

const dataPointSchema = z.object({
  metricType: z.enum([
    "CLIENTS_ONBOARDED",
    "TOTAL_CLIENTS",
    "NEW_LEADS",
    "TASKS_CREATED",
    "TASKS_COMPLETED",
    "AVG_HOURS",
  ]),
  date: z.string().min(1, "Date is required"),
  value: z.coerce.number({ message: "Value must be a number" }),
  notes: z.string().max(500).optional(),
});

export async function createDataPoint(clientId: string, prevState: unknown, formData: FormData) {
  const session = await requireAdmin();

  const raw = {
    metricType: formData.get("metricType") as string,
    date: formData.get("date") as string,
    value: formData.get("value") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = dataPointSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.analyticsDataPoint.create({
    data: {
      clientId,
      metricType: parsed.data.metricType as MetricType,
      date: new Date(parsed.data.date),
      value: parsed.data.value,
      notes: parsed.data.notes || null,
      createdById: session.user.id,
    },
  });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
  revalidatePath(`/analytics`);
  return { success: true };
}

export async function updateDataPoint(id: string, prevState: unknown, formData: FormData) {
  await requireAdmin();

  const point = await prisma.analyticsDataPoint.findUnique({ where: { id } });
  if (!point) return { error: "Data point not found." };

  const raw = {
    metricType: formData.get("metricType") as string || point.metricType,
    date: formData.get("date") as string,
    value: formData.get("value") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = dataPointSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.analyticsDataPoint.update({
    where: { id },
    data: {
      date: new Date(parsed.data.date),
      value: parsed.data.value,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath(`/admin/clients/${point.clientId}/analytics`);
  revalidatePath(`/analytics`);
  return { success: true };
}

export async function deleteDataPoint(id: string) {
  await requireAdmin();

  const point = await prisma.analyticsDataPoint.findUnique({ where: { id } });
  if (!point) throw new Error("Data point not found");

  await prisma.analyticsDataPoint.delete({ where: { id } });
  revalidatePath(`/admin/clients/${point.clientId}/analytics`);
  revalidatePath(`/analytics`);
}
