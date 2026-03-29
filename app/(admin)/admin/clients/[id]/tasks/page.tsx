import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TaskChecklistItem } from "@/components/tasks/TaskChecklistItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { CheckSquare, Plus } from "lucide-react";
import Link from "next/link";

export default async function ClientTasksTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const tasks = await prisma.task.findMany({
    where: { clientId: id, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    include: {
      notes: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
    },
  });

  const sorted = [
    ...tasks.filter((t) => t.status !== "COMPLETED"),
    ...tasks.filter((t) => t.status === "COMPLETED"),
  ];

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

      {sorted.length === 0 ? (
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
        <div className="border border-[#e2e0d9] rounded-xl overflow-hidden">
          {sorted.map((task) => (
            <TaskChecklistItem
              key={task.id}
              task={task}
              notes={task.notes}
              canCheck // admins can always check off tasks
            />
          ))}
        </div>
      )}
    </div>
  );
}
