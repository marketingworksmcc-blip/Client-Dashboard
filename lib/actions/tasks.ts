"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canManageClients, isRevelUser } from "@/lib/permissions";

const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
  allowClientUpdate: z.boolean().default(false),
});

async function requireRevelUser() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createTask(clientId: string, prevState: unknown, formData: FormData) {
  const session = await requireRevelUser();

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || "",
    priority: (formData.get("priority") as string) || "MEDIUM",
    dueDate: (formData.get("dueDate") as string) || "",
    assignedToId: (formData.get("assignedToId") as string) || "",
    allowClientUpdate: formData.get("allowClientUpdate") === "on",
  };

  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const task = await prisma.task.create({
    data: {
      clientId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      assignedToId: parsed.data.assignedToId || null,
      allowClientUpdate: parsed.data.allowClientUpdate,
      createdById: session.user.id,
      status: "TODO",
    },
  });

  await prisma.activityLog.create({
    data: {
      clientId,
      userId: session.user.id,
      action: "created",
      entityType: "Task",
      entityId: task.id,
      entityTitle: task.title,
    },
  });

  revalidatePath(`/admin/clients/${clientId}/tasks`);
  revalidatePath(`/admin/tasks`);
  redirect(`/admin/tasks/${task.id}`);
}

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  // Clients can only update if allowClientUpdate is true
  if (!isRevelUser(session.user.role) && !task.allowClientUpdate) {
    throw new Error("Unauthorized");
  }

  const validStatuses = ["TODO", "IN_PROGRESS", "NEEDS_INPUT", "COMPLETED", "ARCHIVED"];
  if (!validStatuses.includes(status)) throw new Error("Invalid status");

  await prisma.task.update({ where: { id: taskId }, data: { status: status as never } });

  await prisma.activityLog.create({
    data: {
      clientId: task.clientId,
      userId: session.user.id,
      action: "updated",
      entityType: "Task",
      entityId: taskId,
      entityTitle: task.title,
    },
  });

  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath(`/admin/clients/${task.clientId}/tasks`);
}

export async function addTaskNote(taskId: string, prevState: unknown, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const content = (formData.get("content") as string)?.trim();
  if (!content) return { error: "Note cannot be empty." };
  if (content.length > 2000) return { error: "Note is too long (max 2000 characters)." };

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found." };

  await prisma.taskNote.create({
    data: { taskId, userId: session.user.id, content },
  });

  revalidatePath(`/admin/tasks/${taskId}`);
  revalidatePath(`/tasks/${taskId}`);
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const session = await requireRevelUser();

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("Task not found");

  const clientId = task.clientId;

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath(`/admin/clients/${clientId}/tasks`);
  revalidatePath(`/admin/tasks`);
  redirect(`/admin/clients/${clientId}/tasks`);
}
