import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DeadlineList } from "@/components/dashboard/DeadlineList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ImageIcon, DollarSign, CheckSquare, FileText } from "lucide-react";

export default async function ClientDashboardPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0] ?? null;
  const firstName = (session!.user.name ?? "").split(" ")[0];

  const [
    pendingProofs,
    activeTasks,
    docsToReview,
    budgetData,
    recentActivity,
    upcomingProofs,
    upcomingTasks,
  ] = await Promise.all([
    clientId
      ? prisma.proof.count({ where: { clientId, status: { in: ["PENDING_REVIEW", "IN_REVIEW"] } } })
      : 0,
    clientId
      ? prisma.task.count({ where: { clientId, status: { in: ["TODO", "IN_PROGRESS", "NEEDS_INPUT"] } } })
      : 0,
    clientId
      ? prisma.document.count({ where: { clientId, status: { in: ["REQUIRES_REVIEW", "REQUIRES_SIGNATURE"] } } })
      : 0,
    clientId
      ? prisma.budget.findFirst({
          where: { clientId },
          orderBy: { createdAt: "desc" },
          include: { lineItems: { select: { amount: true } } },
        })
      : null,
    clientId
      ? prisma.activityLog.findMany({
          where: { clientId },
          orderBy: { createdAt: "desc" },
          take: 8,
          include: { user: { select: { name: true } } },
        })
      : [],
    clientId
      ? prisma.proof.findMany({
          where: { clientId, dueDate: { not: null }, status: { notIn: ["ARCHIVED", "APPROVED"] } },
          select: { id: true, title: true, dueDate: true, status: true },
          orderBy: { dueDate: "asc" },
          take: 10,
        })
      : [],
    clientId
      ? prisma.task.findMany({
          where: { clientId, dueDate: { not: null }, status: { notIn: ["COMPLETED", "ARCHIVED"] } },
          select: { id: true, title: true, dueDate: true, status: true },
          orderBy: { dueDate: "asc" },
          take: 10,
        })
      : [],
  ]);

  const budgetSpent = budgetData
    ? budgetData.lineItems.reduce((sum, item) => sum + Number(item.amount), 0)
    : null;
  const budgetTotal = budgetData ? Number(budgetData.totalAmount) : null;

  const deadlines = [
    ...upcomingProofs
      .filter((p) => p.dueDate)
      .map((p) => ({ id: p.id, title: p.title, type: "proof" as const, dueDate: p.dueDate!, status: p.status })),
    ...upcomingTasks
      .filter((t) => t.dueDate)
      .map((t) => ({ id: t.id, title: t.title, type: "task" as const, dueDate: t.dueDate!, status: t.status })),
  ]
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 8);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Here's a summary of your portal activity."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <SummaryCard
          title="Pending Reviews"
          value={pendingProofs}
          subtitle="Proofs awaiting review"
          icon={ImageIcon}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <SummaryCard
          title="Budget Spent"
          value={budgetSpent !== null ? formatCurrency(budgetSpent) : "—"}
          subtitle={budgetTotal ? `of ${formatCurrency(budgetTotal)} total` : "No budget set"}
          icon={DollarSign}
          iconBg="bg-[#263a2e]/10"
          iconColor="text-[#263a2e]"
        />
        <SummaryCard
          title="Active Tasks"
          value={activeTasks}
          subtitle="Incomplete tasks"
          icon={CheckSquare}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="Docs to Review"
          value={docsToReview}
          subtitle="Requiring action"
          icon={FileText}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-[#e2e0d9]">
          <CardHeader className="pb-3">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={recentActivity} />
          </CardContent>
        </Card>

        <Card className="border-[#e2e0d9]">
          <CardHeader className="pb-3">
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <DeadlineList items={deadlines} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
