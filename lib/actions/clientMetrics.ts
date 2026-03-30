"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canManageClients } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

function paths(clientId: string) {
  revalidatePath(`/admin/clients/${clientId}/analytics`);
  revalidatePath(`/analytics`);
}

// ── Metric definitions ────────────────────────────────────────

const metricSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid color").default("#263a2e"),
  showAsCard: z.coerce.boolean().default(true),
  showAsChart: z.coerce.boolean().default(true),
});

export async function createClientMetric(
  clientId: string,
  prevState: unknown,
  formData: FormData
) {
  await requireAdmin();

  const raw = {
    name: (formData.get("name") as string)?.trim(),
    color: (formData.get("color") as string) || "#263a2e",
    showAsCard: formData.get("showAsCard") !== "false",
    showAsChart: formData.get("showAsChart") !== "false",
  };

  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // sortOrder = current max + 1
  const max = await prisma.clientMetric.aggregate({
    where: { clientId },
    _max: { sortOrder: true },
  });

  await prisma.clientMetric.create({
    data: {
      clientId,
      name: parsed.data.name,
      color: parsed.data.color,
      showAsCard: parsed.data.showAsCard,
      showAsChart: parsed.data.showAsChart,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });

  paths(clientId);
  return { success: true };
}

export async function updateClientMetric(
  metricId: string,
  prevState: unknown,
  formData: FormData
) {
  await requireAdmin();

  const metric = await prisma.clientMetric.findUnique({ where: { id: metricId } });
  if (!metric) return { error: "Metric not found." };

  const raw = {
    name: (formData.get("name") as string)?.trim() || metric.name,
    color: (formData.get("color") as string) || metric.color,
    showAsCard: formData.has("showAsCard")
      ? formData.get("showAsCard") !== "false"
      : metric.showAsCard,
    showAsChart: formData.has("showAsChart")
      ? formData.get("showAsChart") !== "false"
      : metric.showAsChart,
  };

  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.clientMetric.update({
    where: { id: metricId },
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      showAsCard: parsed.data.showAsCard,
      showAsChart: parsed.data.showAsChart,
    },
  });

  paths(metric.clientId);
  return { success: true };
}

export async function deleteClientMetric(metricId: string) {
  await requireAdmin();

  const metric = await prisma.clientMetric.findUnique({ where: { id: metricId } });
  if (!metric) return;

  await prisma.clientMetric.delete({ where: { id: metricId } });
  paths(metric.clientId);
}

// ── Data points per metric ────────────────────────────────────

const dpSchema = z.object({
  date: z.string().min(1, "Date is required"),
  value: z.coerce.number({ message: "Value must be a number" }),
  notes: z.string().max(500).optional(),
});

export async function addMetricDataPoint(
  metricId: string,
  prevState: unknown,
  formData: FormData
) {
  const session = await requireAdmin();

  const metric = await prisma.clientMetric.findUnique({ where: { id: metricId } });
  if (!metric) return { error: "Metric not found." };

  const raw = {
    date: formData.get("date") as string,
    value: formData.get("value") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = dpSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.clientMetricDataPoint.create({
    data: {
      metricId,
      date: new Date(parsed.data.date),
      value: parsed.data.value,
      notes: parsed.data.notes ?? null,
      createdById: session.user.id,
    },
  });

  paths(metric.clientId);
  return { success: true };
}

export async function updateMetricDataPoint(
  dataPointId: string,
  prevState: unknown,
  formData: FormData
) {
  await requireAdmin();

  const dp = await prisma.clientMetricDataPoint.findUnique({
    where: { id: dataPointId },
    include: { metric: true },
  });
  if (!dp) return { error: "Data point not found." };

  const raw = {
    date: formData.get("date") as string,
    value: formData.get("value") as string,
    notes: (formData.get("notes") as string) || undefined,
  };

  const parsed = dpSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.clientMetricDataPoint.update({
    where: { id: dataPointId },
    data: {
      date: new Date(parsed.data.date),
      value: parsed.data.value,
      notes: parsed.data.notes ?? null,
    },
  });

  paths(dp.metric.clientId);
  return { success: true };
}

export async function deleteMetricDataPoint(dataPointId: string) {
  await requireAdmin();

  const dp = await prisma.clientMetricDataPoint.findUnique({
    where: { id: dataPointId },
    include: { metric: true },
  });
  if (!dp) return;

  await prisma.clientMetricDataPoint.delete({ where: { id: dataPointId } });
  paths(dp.metric.clientId);
}
