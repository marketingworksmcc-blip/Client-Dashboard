import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRY_HOURS = 72;

export async function createPasswordResetToken(userId: string): Promise<string> {
  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId, usedAt: null },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId, token, expiresAt },
  });

  return token;
}

export async function validatePasswordResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!record) return { valid: false, error: "Invalid or expired link." } as const;
  if (record.usedAt) return { valid: false, error: "This link has already been used." } as const;
  if (record.expiresAt < new Date()) return { valid: false, error: "This link has expired. Please contact your Revel account manager." } as const;

  return { valid: true, record } as const;
}

export async function markTokenUsed(token: string) {
  await prisma.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}
