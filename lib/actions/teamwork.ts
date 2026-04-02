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

export async function saveTeamworkConfig(
  clientId: string,
  data: { enabled: boolean; projectId: string; domain: string }
) {
  await requireAdmin();

  const config = await prisma.teamworkConfig.upsert({
    where: { clientId },
    create: { clientId, ...data },
    update: { ...data },
  });

  revalidatePath(`/admin/clients/${clientId}/teamwork`);
  revalidatePath(`/teamwork`);
  return { success: true, config };
}

export async function updateHiddenTaskLists(clientId: string, hiddenIds: string[]) {
  await requireAdmin();

  await prisma.teamworkConfig.update({
    where: { clientId },
    data: { hiddenTaskListIds: hiddenIds },
  });

  revalidatePath(`/admin/clients/${clientId}/teamwork`);
  revalidatePath(`/teamwork`);
  revalidatePath(`/tasks`);
  return { success: true };
}

export async function deleteTeamworkConfig(clientId: string) {
  await requireAdmin();

  await prisma.teamworkConfig.deleteMany({ where: { clientId } });

  revalidatePath(`/admin/clients/${clientId}/teamwork`);
  revalidatePath(`/teamwork`);
  return { success: true };
}
