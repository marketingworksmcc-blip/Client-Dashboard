import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskNotes } from "@/components/tasks/TaskNotes";
import { UpdateTaskStatus } from "@/components/tasks/UpdateTaskStatus";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";

export default async function ClientTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { name: true } },
      notes: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
    },
  });

  if (!task || task.clientId !== clientId) notFound();

  return (
    <div>
      <PageHeader title={task.title} subtitle={task.description ?? ""}>
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href="/tasks">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            All Tasks
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: description + notes */}
        <div className="lg:col-span-2 space-y-6">
          {task.description && (
            <Card className="border-[#e2e0d9]">
              <CardHeader className="pb-3">
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#464540] whitespace-pre-wrap">{task.description}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskNotes taskId={id} notes={task.notes} />
            </CardContent>
          </Card>
        </div>

        {/* Right: status + details */}
        <div className="space-y-5">
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
              </div>
              {task.assignedTo && (
                <div className="flex items-center gap-2 text-sm text-[#8a8880]">
                  <User className="h-4 w-4" />
                  <span>{task.assignedTo.name}</span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-2 text-sm text-[#8a8880]">
                  <Calendar className="h-4 w-4" />
                  <span>Due {formatDate(task.dueDate)}</span>
                </div>
              )}
              <p className="text-xs text-[#8a8880]">Created {formatRelativeTime(task.createdAt)}</p>
            </CardContent>
          </Card>

          {task.status !== "ARCHIVED" && (
            <Card className="border-[#e2e0d9]">
              <CardHeader className="pb-3">
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <UpdateTaskStatus taskId={id} currentStatus={task.status} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
