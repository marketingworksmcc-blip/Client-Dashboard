"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { canManageBudget } from "@/lib/permissions";

async function requireBudgetUser() {
  const session = await auth();
  if (!session?.user || !canManageBudget(session.user.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

const budgetSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  totalAmount: z.coerce.number().positive("Total amount must be greater than 0"),
  period: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

const lineItemSchema = z.object({
  category: z.string().min(1, "Category is required").max(100),
  description: z.string().max(500).optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().optional(),
});

export async function createBudget(clientId: string, prevState: unknown, formData: FormData) {
  await requireBudgetUser();

  const raw = {
    name: formData.get("name") as string,
    totalAmount: formData.get("totalAmount") as string,
    period: (formData.get("period") as string) || "",
    notes: (formData.get("notes") as string) || "",
  };

  const parsed = budgetSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const session = await auth();
  await prisma.budget.create({
    data: {
      clientId,
      name: parsed.data.name,
      totalAmount: parsed.data.totalAmount,
      period: parsed.data.period || null,
      notes: parsed.data.notes || null,
      createdById: session!.user.id,
    },
  });

  revalidatePath(`/admin/clients/${clientId}/budget`);
  redirect(`/admin/clients/${clientId}/budget`);
}

export async function addLineItem(budgetId: string, prevState: unknown, formData: FormData) {
  await requireBudgetUser();

  const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
  if (!budget) return { error: "Budget not found." };

  const raw = {
    category: formData.get("category") as string,
    description: (formData.get("description") as string) || "",
    amount: formData.get("amount") as string,
    date: (formData.get("date") as string) || "",
  };

  const parsed = lineItemSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.budgetLineItem.create({
    data: {
      budgetId,
      category: parsed.data.category,
      description: parsed.data.description || null,
      amount: parsed.data.amount,
      date: parsed.data.date ? new Date(parsed.data.date) : null,
    },
  });

  revalidatePath(`/admin/clients/${budget.clientId}/budget`);
  return { success: true };
}

export async function deleteLineItem(lineItemId: string) {
  await requireBudgetUser();

  const item = await prisma.budgetLineItem.findUnique({
    where: { id: lineItemId },
    include: { budget: { select: { clientId: true } } },
  });
  if (!item) throw new Error("Line item not found");

  await prisma.budgetLineItem.delete({ where: { id: lineItemId } });
  revalidatePath(`/admin/clients/${item.budget.clientId}/budget`);
}

export async function deleteBudget(budgetId: string) {
  await requireBudgetUser();

  const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
  if (!budget) throw new Error("Budget not found");

  await prisma.budget.delete({ where: { id: budgetId } });
  revalidatePath(`/admin/clients/${budget.clientId}/budget`);
  redirect(`/admin/clients/${budget.clientId}/budget`);
}
