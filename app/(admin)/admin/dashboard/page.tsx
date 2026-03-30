import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DeadlineList } from "@/components/dashboard/DeadlineList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ImageIcon, CheckSquare, Users } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();
  const firstName = (session!.user.name ?? "").split(" ")[0];

  const [
    activeClients,
    pendingProofs,
    openTasks,
    portalUsers,
    recentActivity,
    upcomingProofs,
    upcomingTasks,
  ] = await Promise.all([
    prisma.client.count({ where: { isActive: true } }),
    prisma.proof.count({ where: { status: { in: ["PENDING_REVIEW", "IN_REVIEW"] } } }),
    prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS", "NEEDS_INPUT"] } } }),
    prisma.user.count({ where: { role: { in: ["CLIENT_ADMIN", "CLIENT_USER"] }, isActive: true } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
    prisma.proof.findMany({
      where: { dueDate: { not: null }, status: { notIn: ["ARCHIVED", "APPROVED"] } },
      select: { id: true, title: true, dueDate: true, status: true },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
    prisma.task.findMany({
      where: { dueDate: { not: null }, status: { notIn: ["COMPLETED", "ARCHIVED"] } },
      select: { id: true, title: true, dueDate: true, status: true },
      orderBy: { dueDate: "asc" },
      take: 10,
    }),
  ]);

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
        title={`Good morning, ${firstName}`}
        subtitle="Here's what's happening across your client portals."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <SummaryCard
          title="Active Clients"
          value={activeClients}
          subtitle="Across all portals"
          icon={Building2}
          iconBg="bg-[#263a2e]/10"
          iconColor="text-[#263a2e]"
        />
        <SummaryCard
          title="Pending Proofs"
          value={pendingProofs}
          subtitle="Awaiting client review"
          icon={ImageIcon}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <SummaryCard
          title="Open Tasks"
          value={openTasks}
          subtitle="In progress or todo"
          icon={CheckSquare}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="Portal Users"
          value={portalUsers}
          subtitle="Active client accounts"
          icon={Users}
          iconBg="bg-[#d3de2c]/20"
          iconColor="text-[#464540]"
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
