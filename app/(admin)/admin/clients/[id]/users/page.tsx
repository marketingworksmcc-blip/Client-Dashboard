import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { removeUserFromClient } from "@/lib/actions/clients";
import { Users, Plus, UserX } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  CLIENT_ADMIN: "Client Admin",
  CLIENT_USER: "Client User",
  REVEL_ADMIN: "Revel Admin",
  REVEL_TEAM: "Team Member",
  SUPER_ADMIN: "Super Admin",
};

export default async function ClientUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      clientUsers: {
        include: { user: true },
        orderBy: { user: { createdAt: "desc" } },
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Portal Users</CardTitle>
          <Button
            asChild
            size="sm"
            className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs"
          >
            <Link href={`/admin/users/new?clientId=${id}`}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add User
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {client.clientUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users assigned"
              description="Add portal users to give them access to this client's portal."
            >
              <Button
                asChild
                size="sm"
                className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs"
              >
                <Link href={`/admin/users/new?clientId=${id}`}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add User
                </Link>
              </Button>
            </EmptyState>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e0d9] bg-[#faf9f6]">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide hidden sm:table-cell">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide hidden lg:table-cell">Added</th>
                  <th className="px-5 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e0d9]">
                {client.clientUsers.map(({ user }) => {
                  const removeAction = removeUserFromClient.bind(null, id, user.id);
                  return (
                    <tr key={user.id} className="hover:bg-[#faf9f6] transition-colors">
                      <td className="px-5 py-4">
                        <div>
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="font-medium text-[#464540] hover:text-[#263a2e] transition-colors"
                          >
                            {user.name}
                          </Link>
                          <p className="text-xs text-[#8a8880]">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <Badge variant="outline" className="text-xs border-[#e2e0d9] text-[#8a8880]">
                          {roleLabels[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className={
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                              : "bg-gray-50 text-gray-500 border-gray-200 text-xs"
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-[#8a8880] text-xs">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <ConfirmAction
                          trigger={
                            <button className="text-[#cad1cc] hover:text-[#ff6b6c] transition-colors">
                              <UserX className="h-4 w-4" />
                            </button>
                          }
                          title="Remove user from portal?"
                          description={`${user.name} will lose access to this client portal. Their account will not be deleted.`}
                          actionLabel="Remove"
                          destructive
                          onConfirm={removeAction}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
