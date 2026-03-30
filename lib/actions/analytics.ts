"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canManageClients } from "@/lib/permissions";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

const reportSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  reportType: z.enum(["EXTERNAL_LINK", "EMBEDDED", "MANUAL"]),
  reportUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const metricSchema = z.object({
  metricName: z.string().min(1, "Metric name is required").max(100),
  metricValue: z.string().min(1, "Value is required").max(200),
  notes: z.string().max(500).optional(),
});

export async function createReport(clientId: string, prevState: unknown, formData: FormData) {
  const session = await requireAdmin();

  const raw = {
    title: formData.get("title") as string,
    reportType: (formData.get("reportType") as string) || "EXTERNAL_LINK",
    reportUrl: (formData.get("reportUrl") as string) || "",
  };

  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (parsed.data.reportType !== "MANUAL" && !parsed.data.reportUrl) {
    return { error: "A URL is required for link and embedded reports." };
  }

  await prisma.analyticsReport.create({
    data: {
      clientId,
      title: parsed.data.title,
      reportType: parsed.data.reportType,
      reportUrl: parsed.data.reportUrl || null,
      embedMode: parsed.data.reportType === "EMBEDDED",
      createdById: session.user.id,
    },
  });

  revalidatePath(`/admin/clients/${clientId}/analytics`);
  return { success: true };
}

export async function deleteReport(reportId: string) {
  await requireAdmin();

  const report = await prisma.analyticsReport.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Report not found");

  await prisma.analyticsReport.delete({ where: { id: reportId } });
  revalidatePath(`/admin/clients/${report.clientId}/analytics`);
}

export async function addMetric(reportId: string, prevState: unknown, formData: FormData) {
  await requireAdmin();

  const report = await prisma.analyticsReport.findUnique({ where: { id: reportId } });
  if (!report) return { error: "Report not found." };

  const raw = {
    metricName: formData.get("metricName") as string,
    metricValue: formData.get("metricValue") as string,
    notes: (formData.get("notes") as string) || "",
  };

  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.analyticsMetric.create({
    data: {
      reportId,
      metricName: parsed.data.metricName,
      metricValue: parsed.data.metricValue,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath(`/admin/clients/${report.clientId}/analytics`);
  revalidatePath(`/analytics`);
  return { success: true };
}

export async function updateMetric(metricId: string, prevState: unknown, formData: FormData) {
  await requireAdmin();

  const metric = await prisma.analyticsMetric.findUnique({
    where: { id: metricId },
    include: { report: { select: { clientId: true } } },
  });
  if (!metric) return { error: "Metric not found." };

  const raw = {
    metricName: formData.get("metricName") as string,
    metricValue: formData.get("metricValue") as string,
    notes: (formData.get("notes") as string) || "",
  };

  const parsed = metricSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.analyticsMetric.update({
    where: { id: metricId },
    data: {
      metricName: parsed.data.metricName,
      metricValue: parsed.data.metricValue,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath(`/admin/clients/${metric.report.clientId}/analytics`);
  revalidatePath(`/analytics`);
  return { success: true };
}

export async function deleteMetric(metricId: string) {
  await requireAdmin();

  const metric = await prisma.analyticsMetric.findUnique({
    where: { id: metricId },
    include: { report: { select: { clientId: true } } },
  });
  if (!metric) throw new Error("Metric not found");

  await prisma.analyticsMetric.delete({ where: { id: metricId } });
  revalidatePath(`/admin/clients/${metric.report.clientId}/analytics`);
}
