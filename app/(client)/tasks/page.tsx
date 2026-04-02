import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { TaskChecklistItem } from "@/components/tasks/TaskChecklistItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { TeamworkTaskList } from "@/components/teamwork/TeamworkTaskList";
import { fetchTasks } from "@/lib/teamwork";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export default async function ClientTasksPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const [tasks, teamworkConfig] = await Promise.all([
    clientId
      ? prisma.task.findMany({
          where: { clientId },
          orderBy: { createdAt: "desc" },
          include: {
            notes: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
          },
        })
      : [],
    clientId
      ? prisma.teamworkConfig.findUnique({ where: { clientId } })
      : null,
  ]);

  // Sort portal tasks: active → completed → archived
  const sorted = [
    ...tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "ARCHIVED"),
    ...tasks.filter((t) => t.status === "COMPLETED"),
    ...tasks.filter((t) => t.status === "ARCHIVED"),
  ];

  // Fetch Teamwork tasks if integration is enabled
  let twTasks: Awaited<ReturnType<typeof fetchTasks>> = [];
  if (teamworkConfig?.enabled && teamworkConfig.projectId && teamworkConfig.domain) {
    try {
      twTasks = await fetchTasks(teamworkConfig.domain, teamworkConfig.projectId);
    } catch {
      // Silently fall back to empty list
    }
  }

  const showTeamwork = teamworkConfig?.enabled && true;
  const hasPortalTasks = sorted.length > 0;

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Items that need your attention." />

      {showTeamwork ? (
        // ── Two-column layout when Teamwork is enabled ──
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Portal tasks */}
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Portal Tasks</CardTitle>
                {hasPortalTasks && (
                  <span className="text-xs text-[#8a8880]">
                    {sorted.filter((t) => t.status !== "COMPLETED" && t.status !== "ARCHIVED").length} active
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {hasPortalTasks ? (
                <div className="divide-y divide-[#f0efe9]">
                  {sorted.map((task) => (
                    <TaskChecklistItem
                      key={task.id}
                      task={task}
                      notes={task.notes}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <CheckSquare className="h-7 w-7 text-[#e2e0d9] mx-auto mb-2" />
                  <p className="text-sm text-[#8a8880]">No tasks yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teamwork tasks */}
          <TeamworkTaskList tasks={twTasks} title="Teamwork Tasks" />
        </div>
      ) : (
        // ── Single-column layout (no Teamwork) ──
        <>
          {hasPortalTasks ? (
            <div className="border border-[#e2e0d9] rounded-xl overflow-hidden">
              {sorted.map((task) => (
                <TaskChecklistItem
                  key={task.id}
                  task={task}
                  notes={task.notes}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckSquare}
              title="No tasks yet"
              description="Tasks assigned by your Revel team will appear here."
            />
          )}
        </>
      )}
    </div>
  );
}
