import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { CheckSquare, Calendar } from "lucide-react";
import Link from "next/link";

export default async function ClientTasksPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const tasks = clientId
    ? await prisma.task.findMany({
        where: { clientId, status: { not: "ARCHIVED" } },
        orderBy: { createdAt: "desc" },
        include: { assignedTo: { select: { name: true } } },
      })
    : [];

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Items that need your attention." />

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Tasks assigned by your Revel team will appear here."
        />
      ) : (
        <div className="divide-y divide-[#f0efe9] border border-[#e2e0d9] rounded-xl overflow-hidden bg-white">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-[#faf9f6] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-[#f0efe9] flex items-center justify-center flex-shrink-0">
                <CheckSquare className="h-4 w-4 text-[#8a8880]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#464540] truncate">{task.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {task.assignedTo && (
                    <span className="text-xs text-[#8a8880]">{task.assignedTo.name}</span>
                  )}
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-[#8a8880]">
                      <Calendar className="h-3 w-3" />
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
