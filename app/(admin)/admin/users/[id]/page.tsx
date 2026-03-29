import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpdateUserForm } from "@/components/admin/UpdateUserForm";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { deleteUser } from "@/lib/actions/users";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  REVEL_ADMIN: "Revel Admin",
  REVEL_TEAM: "Team Member",
  CLIENT_ADMIN: "Client Admin",
  CLIENT_USER: "Client User",
};

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      clientUsers: {
        include: { client: { select: { id: true, name: true, isActive: true } } },
      },
    },
  });

  if (!user) notFound();

  const deleteWithId = deleteUser.bind(null, id);

  return (
    <div>
      <PageHeader title={user.name} subtitle={user.email}>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Active
        </Badge>
        <Button variant="outline" asChild className="text-sm border-[#e2e0d9]">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            All Users
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <UpdateUserForm
                userId={id}
                defaultName={user.name}
                defaultEmail={user.email}
                defaultRole={user.role}
              />
            </CardContent>
          </Card>

          <Card className="border-[#ff6b6c]/20">
            <CardHeader>
              <CardTitle className="text-[#ff6b6c]">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[#464540]">Delete account</p>
                  <p className="text-xs text-[#8a8880] mt-0.5">
                    Permanently removes the user and all their portal access. This cannot be undone.
                  </p>
                </div>
                <DeleteUserButton userName={user.name} deleteAction={deleteWithId} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-[#8a8880] mb-1">Role</p>
                <p className="text-sm font-medium text-[#464540]">
                  {roleLabels[user.role] ?? user.role}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8a8880] mb-1">Created</p>
                <p className="text-sm text-[#464540]">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-[#8a8880] mb-1">Last Updated</p>
                <p className="text-sm text-[#464540]">{formatDate(user.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {user.clientUsers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Client Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {user.clientUsers.map(({ client }) => (
                  <Link
                    key={client.id}
                    href={`/admin/clients/${client.id}`}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f0efe9] transition-colors"
                  >
                    <Building2 className="h-3.5 w-3.5 text-[#8a8880] flex-shrink-0" />
                    <span className="text-sm text-[#464540]">{client.name}</span>
                    {!client.isActive && (
                      <Badge
                        variant="outline"
                        className="text-xs ml-auto text-gray-500 border-gray-200"
                      >
                        Archived
                      </Badge>
                    )}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
