"use server";

import { prisma } from "@/lib/prisma";
import { validatePasswordResetToken, markTokenUsed } from "@/lib/tokens";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type State = { error?: string } | null;

export async function setPassword(prevState: State, formData: FormData): Promise<State> {
  const raw = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const result = await validatePasswordResetToken(parsed.data.token);
  if (!result.valid) {
    return { error: result.error };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({
    where: { id: result.record.user.id },
    data: { passwordHash },
  });

  await markTokenUsed(parsed.data.token);

  redirect("/login?welcome=1");
}
