import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { TaskNotes } from "@/components/tasks/TaskNotes";
import { UpdateTaskStatus } from "@/components/tasks/UpdateTaskStatus";
import { DeleteTaskButton } from "@/components/tasks/DeleteTaskButton";
import { EditTaskForm } from "@/components/tasks/EditTaskForm";
import { deleteTask } from "@/lib/actions/tasks";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, Building2, Calendar, User } from "lucide-react";
import Link from "next/link";

export default async function AdminTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [task, clientUsers] = await Promise.all([
    prisma.task.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        notes: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
      },
    }),
    prisma.clientUser.findMany({
      where: { client: { tasks: { some: { id } } } },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  if (!task) notFound();

  const deleteWithId = deleteTask.bind(null, id);
  const assignableUsers = clientUsers.map((cu) => ({ id: cu.user.id, name: cu.user.name }));

  return (
    <div>
      <PageHeader title={task.title} subtitle={task.description ?? ""}>
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href={`/admin/clients/${task.client.id}/tasks`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to {task.client.name}
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

        {/* Right: details + actions */}
        <div className="space-y-5">
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[#8a8880]">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <Link href={`/admin/clients/${task.client.id}`}
                  className="hover:text-[#464540] transition-colors">
                  {task.client.name}
                </Link>
              </div>
              {task.assignedTo && (
                <div className="flex items-center gap-2 text-[#8a8880]">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span>{task.assignedTo.name}</span>
                </div>
              )}
              {task.dueDate && (
                <div className="flex items-center gap-2 text-[#8a8880]">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Due {formatDate(task.dueDate)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <TaskPriorityBadge priority={task.priority} />
                <TaskStatusBadge status={task.status} />
              </div>
              <p className="text-xs text-[#8a8880]">Created {formatRelativeTime(task.createdAt)}</p>
              {task.allowClientUpdate && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1">
                  Client can update status
                </p>
              )}
              <EditTaskForm
                taskId={id}
                assignableUsers={assignableUsers}
                defaults={{
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  dueDate: task.dueDate,
                  assignedToId: task.assignedTo?.id ?? null,
                  allowClientUpdate: task.allowClientUpdate,
                }}
              />
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

          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <DeleteTaskButton taskTitle={task.title} deleteAction={deleteWithId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
