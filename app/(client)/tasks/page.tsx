import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { TaskChecklistItem } from "@/components/tasks/TaskChecklistItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { CheckSquare } from "lucide-react";

export default async function ClientTasksPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const tasks = clientId
    ? await prisma.task.findMany({
        where: { clientId, status: { not: "ARCHIVED" } },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          notes: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
        },
      })
    : [];

  // Sort: incomplete first, completed last
  const sorted = [
    ...tasks.filter((t) => t.status !== "COMPLETED"),
    ...tasks.filter((t) => t.status === "COMPLETED"),
  ];

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Items that need your attention." />

      {sorted.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Tasks assigned by your Revel team will appear here."
        />
      ) : (
        <div className="border border-[#e2e0d9] rounded-xl overflow-hidden">
          {sorted.map((task) => (
            <TaskChecklistItem
              key={task.id}
              task={task}
              notes={task.notes}
              canCheck={task.allowClientUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
