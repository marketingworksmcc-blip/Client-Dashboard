"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { canManageUsers } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendWelcomeEmail } from "@/lib/email";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "REVEL_ADMIN", "REVEL_TEAM", "CLIENT_ADMIN", "CLIENT_USER"]),
  clientId: z.string().optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  role: z.enum(["SUPER_ADMIN", "REVEL_ADMIN", "REVEL_TEAM", "CLIENT_ADMIN", "CLIENT_USER"]),
  password: z.string().min(8).optional().or(z.literal("")),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createUser(prevState: unknown, formData: FormData) {
  await requireAdmin();

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    role: formData.get("role") as Role,
    clientId: formData.get("clientId") as string || undefined,
  };

  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      ...(parsed.data.clientId && {
        clientUsers: {
          create: { clientId: parsed.data.clientId, isPrimary: true },
        },
      }),
    },
  });

  // Send welcome email with password-set link
  try {
    let clientName: string | undefined;
    if (parsed.data.clientId) {
      const client = await prisma.client.findUnique({
        where: { id: parsed.data.clientId },
        select: { name: true },
      });
      clientName = client?.name;
    }
    const token = await createPasswordResetToken(user.id);
    await sendWelcomeEmail({ name: user.name, email: user.email, token, clientName });
  } catch (err) {
    // Email failure is non-fatal — user is created, admin can resend manually
    console.error("[createUser] Failed to send welcome email:", err);
  }

  revalidatePath("/admin/users");
  redirect(`/admin/users/${user.id}`);
}

export async function updateUser(userId: string, prevState: unknown, formData: FormData) {
  await requireAdmin();

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as Role,
    password: formData.get("password") as string,
  };

  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const emailConflict = await prisma.user.findFirst({
    where: { email: parsed.data.email, NOT: { id: userId } },
  });
  if (emailConflict) {
    return { error: "This email is already in use by another account." };
  }

  const updateData: Record<string, unknown> = {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
  };

  if (parsed.data.password) {
    updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  await prisma.user.update({ where: { id: userId }, data: updateData });

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
