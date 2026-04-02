import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { CheckSquare, Calendar } from "lucide-react";
import Link from "next/link";

export default async function AdminTasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      assignedTo: { select: { name: true } },
    },
  });

  // Sort: active → completed → archived
  const sorted = [
    ...tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "ARCHIVED"),
    ...tasks.filter((t) => t.status === "COMPLETED"),
    ...tasks.filter((t) => t.status === "ARCHIVED"),
  ];

  return (
    <div>
      <PageHeader title="Tasks" subtitle="All tasks across every client." />

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create tasks from a client's detail page."
        />
      ) : (
        <div className="divide-y divide-[#f0efe9] border border-[#e2e0d9] rounded-xl overflow-hidden">
          {sorted.map((task) => {
            const isArchived = task.status === "ARCHIVED";
            return (
              <Link
                key={task.id}
                href={`/admin/tasks/${task.id}`}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  isArchived
                    ? "bg-[#f7f6f3] opacity-60 hover:opacity-80"
                    : "bg-white hover:bg-[#faf9f6]"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-[#f0efe9] flex items-center justify-center flex-shrink-0">
                  <CheckSquare className="h-4 w-4 text-[#8a8880]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isArchived ? "line-through text-[#8a8880]" : "text-[#464540]"}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#8a8880]">{task.client.name}</span>
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
                  <span className="hidden sm:block"><TaskPriorityBadge priority={task.priority} /></span>
                  <TaskStatusBadge status={task.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
