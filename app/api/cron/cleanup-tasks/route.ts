import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/cron/cleanup-tasks
 *
 * Permanently deletes tasks that have been ARCHIVED for more than 30 days.
 * Call this route daily from your cron service (Vercel Cron, GitHub Actions, etc.).
 *
 * Secure with CRON_SECRET in .env:
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Vercel cron.json example:
 *   { "crons": [{ "path": "/api/cron/cleanup-tasks", "schedule": "0 2 * * *" }] }
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const result = await prisma.task.deleteMany({
    where: {
      status: "ARCHIVED",
      updatedAt: { lt: cutoff },
    },
  });

  return NextResponse.json({
    deleted: result.count,
    cutoff: cutoff.toISOString(),
  });
}
