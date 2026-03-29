"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canManageClients } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const documentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  status: z.enum(["REQUIRES_REVIEW", "REQUIRES_SIGNATURE", "REFERENCE"]).default("REFERENCE"),
  externalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

async function requireRevelUser() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

async function saveUploadedFile(
  file: File,
  clientId: string
): Promise<{ fileUrl: string; fileName: string; fileSize: number; mimeType: string }> {
  if (file.size > 50 * 1024 * 1024) throw new Error("File must be under 50 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const filename = `${clientId}-${Date.now()}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "documents");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return {
    fileUrl: `/uploads/documents/${filename}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export async function createDocument(clientId: string, prevState: unknown, formData: FormData) {
  const session = await requireRevelUser();

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || "",
    category: (formData.get("category") as string) || "",
    status: (formData.get("status") as string) || "REFERENCE",
    externalUrl: (formData.get("externalUrl") as string) || "",
  };

  const parsed = documentSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let fileData: { fileUrl: string; fileName: string; fileSize: number; mimeType: string } | null = null;
  const file = formData.get("file") as File | null;

  if (file && file.size > 0) {
    try {
      fileData = await saveUploadedFile(file, clientId);
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Upload failed." };
    }
  }

  const externalUrl = parsed.data.externalUrl || null;
  if (!fileData && !externalUrl) {
    return { error: "Please upload a file or provide an external link." };
  }

  const doc = await prisma.document.create({
    data: {
      clientId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      category: parsed.data.category || null,
      status: parsed.data.status,
      fileUrl: fileData?.fileUrl ?? null,
      externalUrl,
      fileName: fileData?.fileName ?? null,
      fileSize: fileData?.fileSize ?? null,
      mimeType: fileData?.mimeType ?? null,
      createdById: session.user.id,
    },
  });

  await prisma.activityLog.create({
    data: {
      clientId,
      userId: session.user.id,
      action: "uploaded",
      entityType: "Document",
      entityId: doc.id,
      entityTitle: doc.title,
    },
  });

  revalidatePath(`/admin/clients/${clientId}/documents`);
  revalidatePath(`/admin/documents`);
  redirect(`/admin/clients/${clientId}/documents`);
}

export async function deleteDocument(documentId: string) {
  await requireRevelUser();

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  const clientId = doc.clientId;

  await prisma.document.delete({ where: { id: documentId } });

  if (doc.fileUrl?.startsWith("/uploads/")) {
    const { unlink } = await import("fs/promises");
    try {
      await unlink(join(process.cwd(), "public", doc.fileUrl));
    } catch {
      // File already gone
    }
  }

  revalidatePath(`/admin/clients/${clientId}/documents`);
  revalidatePath(`/admin/documents`);
  redirect(`/admin/clients/${clientId}/documents`);
}
