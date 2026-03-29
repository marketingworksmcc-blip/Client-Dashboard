import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewTaskForm } from "@/components/tasks/NewTaskForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [client, clientUsers] = await Promise.all([
    prisma.client.findUnique({ where: { id } }),
    prisma.clientUser.findMany({
      where: { clientId: id },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  if (!client) notFound();

  const assignableUsers = clientUsers.map((cu) => ({ id: cu.user.id, name: cu.user.name }));

  return (
    <div>
      <PageHeader title="New Task" subtitle={`Creating for ${client.name}`}>
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href={`/admin/clients/${id}/tasks`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl border-[#e2e0d9]">
        <CardHeader className="pb-4">
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewTaskForm clientId={id} assignableUsers={assignableUsers} />
        </CardContent>
      </Card>
    </div>
  );
}
