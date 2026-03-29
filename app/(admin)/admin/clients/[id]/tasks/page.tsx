import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { CheckSquare, Plus, Calendar } from "lucide-react";
import Link from "next/link";

export default async function ClientTasksTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const tasks = await prisma.task.findMany({
    where: { clientId: id, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: { assignedTo: { select: { name: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]">
          <Link href={`/admin/clients/${id}/tasks/new`}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Task
          </Link>
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create tasks for this client to track and action."
        >
          <Button asChild className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]">
            <Link href={`/admin/clients/${id}/tasks/new`}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Task
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="divide-y divide-[#f0efe9] border border-[#e2e0d9] rounded-xl overflow-hidden">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/admin/tasks/${task.id}`}
              className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-[#faf9f6] transition-colors"
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
