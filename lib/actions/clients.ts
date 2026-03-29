"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import { canManageClients } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens").optional(),
});

const brandingSchema = z.object({
  portalName: z.string().max(80).optional(),
  portalSubtitle: z.string().max(120).optional(),
  logoUrl: z.string().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").optional().or(z.literal("")),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color").optional().or(z.literal("")),
  backgroundStyle: z.enum(["default", "light", "dark"]).optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !canManageClients(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function createClient(prevState: unknown, formData: FormData) {
  await requireAdmin();

  const raw = {
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
  };

  const parsed = clientSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const slug = parsed.data.slug || slugify(parsed.data.name);

  const existing = await prisma.client.findUnique({ where: { slug } });
  if (existing) {
    return { error: "A client with this slug already exists. Try a different name." };
  }

  const client = await prisma.client.create({
    data: {
      name: parsed.data.name,
      slug,
      brandSettings: {
        create: {
          portalName: parsed.data.name,
          primaryColor: "#d3de2c",
          secondaryColor: "#263a2e",
        },
      },
    },
  });

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${client.id}`);
}

export async function updateClient(clientId: string, prevState: unknown, formData: FormData) {
  await requireAdmin();

  const raw = { name: formData.get("name") as string };
  const parsed = clientSchema.pick({ name: true }).safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { name: parsed.data.name },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  return { success: true };
}

export async function archiveClient(clientId: string) {
  await requireAdmin();

  await prisma.client.update({
    where: { id: clientId },
    data: { isActive: false },
  });

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function restoreClient(clientId: string) {
  await requireAdmin();
  await prisma.client.update({ where: { id: clientId }, data: { isActive: true } });
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
}

export async function updateClientBranding(clientId: string, prevState: unknown, formData: FormData) {
  await requireAdmin();

  // Handle logo upload if a file was provided
  let logoUrl = formData.get("logoUrl") as string;
  const logoFile = formData.get("logoFile") as File | null;
  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 2 * 1024 * 1024) {
      return { error: "Logo file must be under 2 MB." };
    }
    const ext = logoFile.name.split(".").pop()?.toLowerCase();
    if (!["png", "svg", "jpg", "jpeg", "webp"].includes(ext ?? "")) {
      return { error: "Logo must be a PNG, SVG, JPG, or WebP file." };
    }
    const filename = `${clientId}-${Date.now()}.${ext}`;
    const dir = join(process.cwd(), "public", "logos");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    await writeFile(join(dir, filename), buffer);
    logoUrl = `/logos/${filename}`;
  }

  const raw = {
    portalName: formData.get("portalName") as string,
    portalSubtitle: formData.get("portalSubtitle") as string,
    logoUrl,
    primaryColor: formData.get("primaryColor") as string,
    secondaryColor: formData.get("secondaryColor") as string,
    backgroundStyle: formData.get("backgroundStyle") as string,
  };

  const parsed = brandingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.clientBrandSettings.upsert({
    where: { clientId },
    update: {
      portalName: parsed.data.portalName || null,
      portalSubtitle: parsed.data.portalSubtitle || null,
      logoUrl: parsed.data.logoUrl || null,
      primaryColor: parsed.data.primaryColor || null,
      secondaryColor: parsed.data.secondaryColor || null,
      backgroundStyle: parsed.data.backgroundStyle || null,
    },
    create: {
      clientId,
      portalName: parsed.data.portalName || null,
      portalSubtitle: parsed.data.portalSubtitle || null,
      logoUrl: parsed.data.logoUrl || null,
      primaryColor: parsed.data.primaryColor || null,
      secondaryColor: parsed.data.secondaryColor || null,
      backgroundStyle: parsed.data.backgroundStyle || null,
    },
  });

  revalidatePath(`/admin/clients/${clientId}/branding`);
  return { success: true };
}

export async function removeUserFromClient(clientId: string, userId: string) {
  await requireAdmin();
  await prisma.clientUser.deleteMany({ where: { clientId, userId } });
  revalidatePath(`/admin/clients/${clientId}/users`);
}

export async function assignUserToClient(clientId: string, userId: string) {
  await requireAdmin();
  await prisma.clientUser.upsert({
    where: { userId_clientId: { userId, clientId } },
    update: {},
    create: { userId, clientId },
  });
  revalidatePath(`/admin/clients/${clientId}/users`);
}
