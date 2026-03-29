import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

const roleLabels: Record<string, { label: string; className: string }> = {
  SUPER_ADMIN:  { label: "Super Admin",   className: "bg-purple-50 text-purple-700 border-purple-200" },
  REVEL_ADMIN:  { label: "Revel Admin",   className: "bg-[#263a2e]/10 text-[#263a2e] border-[#263a2e]/20" },
  REVEL_TEAM:   { label: "Team Member",   className: "bg-[#d3de2c]/20 text-[#464540] border-[#d3de2c]/40" },
  CLIENT_ADMIN: { label: "Client Admin",  className: "bg-blue-50 text-blue-700 border-blue-200" },
  CLIENT_USER:  { label: "Client User",   className: "bg-slate-50 text-slate-600 border-slate-200" },
};

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      clientUsers: { include: { client: { select: { name: true, id: true } } } },
    },
  });

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} total user${users.length !== 1 ? "s" : ""}`}>
        <Button asChild className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-sm">
          <Link href="/admin/users/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New User
          </Link>
        </Button>
      </PageHeader>

      {users.length === 0 ? (
        <div className="rounded-xl border border-[#e2e0d9] bg-white">
          <EmptyState
            icon={Users}
            title="No users yet"
            description="Create Revel team members and client portal accounts."
          />
        </div>
      ) : (
        <div className="rounded-xl border border-[#e2e0d9] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2e0d9] bg-[#faf9f6]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide hidden sm:table-cell">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide hidden md:table-cell">Clients</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e0d9]">
              {users.map((user) => {
                const role = roleLabels[user.role];
                return (
                  <tr key={user.id} className="hover:bg-[#faf9f6] transition-colors group">
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
                      {role && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${role.className}`}
                        >
                          {role.label}
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {user.clientUsers.length === 0 ? (
                        <span className="text-xs text-[#cad1cc]">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.clientUsers.slice(0, 2).map(({ client }) => (
                            <Link key={client.id} href={`/admin/clients/${client.id}`}>
                              <Badge
                                variant="outline"
                                className="text-xs border-[#e2e0d9] text-[#8a8880] hover:border-[#263a2e] hover:text-[#263a2e] transition-colors"
                              >
                                {client.name}
                              </Badge>
                            </Link>
                          ))}
                          {user.clientUsers.length > 2 && (
                            <Badge variant="outline" className="text-xs border-[#e2e0d9] text-[#8a8880]">
                              +{user.clientUsers.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell text-[#8a8880] text-xs">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-5 py-4">
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
                    <td className="px-5 py-4">
                      <Link href={`/admin/users/${user.id}`}>
                        <ChevronRight className="h-4 w-4 text-[#cad1cc] group-hover:text-[#8a8880] transition-colors" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
