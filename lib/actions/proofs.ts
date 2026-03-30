"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canManageClients } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const proofSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().optional(),
  externalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  versionNotes: z.string().max(500).optional(),
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
  const dir = join(process.cwd(), "public", "uploads", "proofs");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));
  return {
    fileUrl: `/uploads/proofs/${filename}`,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

export async function createProof(clientId: string, prevState: unknown, formData: FormData) {
  const session = await requireRevelUser();

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || "",
    dueDate: (formData.get("dueDate") as string) || "",
    externalUrl: (formData.get("externalUrl") as string) || "",
    versionNotes: (formData.get("versionNotes") as string) || "",
  };

  const parsed = proofSchema.safeParse(raw);
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

  const proof = await prisma.proof.create({
    data: {
      clientId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      createdById: session.user.id,
      status: "PENDING_REVIEW",
      versions: {
        create: {
          versionNum: 1,
          fileUrl: fileData?.fileUrl ?? null,
          externalUrl,
          fileName: fileData?.fileName ?? null,
          fileSize: fileData?.fileSize ?? null,
          mimeType: fileData?.mimeType ?? null,
          notes: parsed.data.versionNotes || null,
          createdById: session.user.id,
        },
      },
    },
  });

  await prisma.activityLog.create({
    data: {
      clientId,
      userId: session.user.id,
      action: "created",
      entityType: "Proof",
      entityId: proof.id,
      entityTitle: proof.title,
    },
  });

  revalidatePath(`/admin/clients/${clientId}/proofs`);
  revalidatePath(`/admin/proofs`);
  redirect(`/admin/proofs/${proof.id}`);
}

export async function addProofVersion(proofId: string, prevState: unknown, formData: FormData) {
  const session = await requireRevelUser();

  const proof = await prisma.proof.findUnique({ where: { id: proofId } });
  if (!proof) return { error: "Proof not found." };

  const versionCount = await prisma.proofVersion.count({ where: { proofId } });

  let fileData: { fileUrl: string; fileName: string; fileSize: number; mimeType: string } | null = null;
  const file = formData.get("file") as File | null;

  if (file && file.size > 0) {
    try {
      fileData = await saveUploadedFile(file, proof.clientId);
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Upload failed." };
    }
  }

  const externalUrl = (formData.get("externalUrl") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!fileData && !externalUrl) {
    return { error: "Please upload a file or provide an external link." };
  }

  await prisma.proofVersion.create({
    data: {
      proofId,
      versionNum: versionCount + 1,
      fileUrl: fileData?.fileUrl ?? null,
      externalUrl,
      fileName: fileData?.fileName ?? null,
      fileSize: fileData?.fileSize ?? null,
      mimeType: fileData?.mimeType ?? null,
      notes,
      createdById: session.user.id,
    },
  });

  await prisma.proof.update({
    where: { id: proofId },
    data: { status: "PENDING_REVIEW" },
  });

  await prisma.activityLog.create({
    data: {
      clientId: proof.clientId,
      userId: session.user.id,
      action: "uploaded",
      entityType: "Proof",
      entityId: proofId,
      entityTitle: proof.title,
    },
  });

  revalidatePath(`/admin/proofs/${proofId}`);
  revalidatePath(`/admin/clients/${proof.clientId}/proofs`);
  return { success: true };
}

export async function submitApproval(proofId: string, prevState: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const action = formData.get("action") as string;
  const notes = (formData.get("notes") as string)?.trim() || null;

  if (!["APPROVED", "CHANGES_REQUESTED"].includes(action)) {
    return { error: "Invalid action." };
  }

  if (action === "CHANGES_REQUESTED" && !notes) {
    return { error: "Please describe what changes are needed." };
  }

  const proof = await prisma.proof.findUnique({ where: { id: proofId } });
  if (!proof) return { error: "Proof not found." };

  await prisma.proofApproval.create({
    data: { proofId, userId: session.user.id, action: action as "APPROVED" | "CHANGES_REQUESTED", notes },
  });

  await prisma.proof.update({
    where: { id: proofId },
    data: { status: action === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED" },
  });

  await prisma.activityLog.create({
    data: {
      clientId: proof.clientId,
      userId: session.user.id,
      action: action === "APPROVED" ? "approved" : "rejected",
      entityType: "Proof",
      entityId: proofId,
      entityTitle: proof.title,
    },
  });

  revalidatePath(`/admin/proofs/${proofId}`);
  revalidatePath(`/proofs/${proofId}`);
  return { success: true };
}

export async function addComment(proofId: string, prevState: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const content = (formData.get("content") as string)?.trim();
  if (!content) return { error: "Comment cannot be empty." };
  if (content.length > 2000) return { error: "Comment is too long (max 2000 characters)." };

  const proof = await prisma.proof.findUnique({ where: { id: proofId } });
  if (!proof) return { error: "Proof not found." };

  await prisma.proofComment.create({
    data: { proofId, userId: session.user.id, content },
  });

  await prisma.activityLog.create({
    data: {
      clientId: proof.clientId,
      userId: session.user.id,
      action: "commented",
      entityType: "Proof",
      entityId: proofId,
      entityTitle: proof.title,
    },
  });

  revalidatePath(`/admin/proofs/${proofId}`);
  revalidatePath(`/proofs/${proofId}`);
  return { success: true };
}

export async function archiveProof(proofId: string) {
  const session = await requireRevelUser();
  const proof = await prisma.proof.findUnique({ where: { id: proofId } });
  if (!proof) throw new Error("Proof not found");

  await prisma.proof.update({ where: { id: proofId }, data: { status: "ARCHIVED" } });

  await prisma.activityLog.create({
    data: {
      clientId: proof.clientId,
      userId: session.user.id,
      action: "archived",
      entityType: "Proof",
      entityId: proofId,
      entityTitle: proof.title,
    },
  });

  revalidatePath(`/admin/proofs/${proofId}`);
  revalidatePath(`/admin/clients/${proof.clientId}/proofs`);
  revalidatePath(`/admin/proofs`);
  redirect(`/admin/clients/${proof.clientId}/proofs`);
}

export async function updateProof(proofId: string, prevState: unknown, formData: FormData) {
  await requireRevelUser();

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || "",
    dueDate: (formData.get("dueDate") as string) || "",
  };

  const schema = proofSchema.pick({ title: true, description: true, dueDate: true });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.proof.update({
    where: { id: proofId },
    data: {
      title: parsed.data.title,
      description: parsed.data.description || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
    },
  });

  revalidatePath(`/admin/proofs/${proofId}`);
  return { success: true };
}

export async function setProofInReview(proofId: string) {
  await requireRevelUser();
  await prisma.proof.update({ where: { id: proofId }, data: { status: "IN_REVIEW" } });
  revalidatePath(`/admin/proofs/${proofId}`);
}

export async function deleteProof(proofId: string) {
  const session = await requireRevelUser();

  const proof = await prisma.proof.findUnique({
    where: { id: proofId },
    include: { versions: { select: { fileUrl: true } } },
  });
  if (!proof) throw new Error("Proof not found");

  const clientId = proof.clientId;

  // Delete from DB (cascades to versions, comments, approvals)
  await prisma.proof.delete({ where: { id: proofId } });

  // Delete uploaded files from disk
  const { unlink } = await import("fs/promises");
  for (const version of proof.versions) {
    if (version.fileUrl?.startsWith("/uploads/")) {
      try {
        await unlink(join(process.cwd(), "public", version.fileUrl));
      } catch {
        // File already gone — not a fatal error
      }
    }
  }

  revalidatePath(`/admin/clients/${clientId}/proofs`);
  revalidatePath(`/admin/proofs`);
  redirect(`/admin/clients/${clientId}/proofs`);
}
