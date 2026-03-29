import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Building2, Plus, Users, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default async function AdminClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { clientUsers: true } },
      brandSettings: { select: { primaryColor: true, portalName: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Clients" subtitle={`${clients.length} total client${clients.length !== 1 ? "s" : ""}`}>
        <Button
          asChild
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-sm"
        >
          <Link href="/admin/clients/new">
            <Plus className="h-4 w-4 mr-1.5" />
            New Client
          </Link>
        </Button>
      </PageHeader>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-[#e2e0d9] bg-white">
          <EmptyState
            icon={Building2}
            title="No clients yet"
            description="Create your first client portal to get started."
          >
            <Button asChild className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-sm">
              <Link href="/admin/clients/new">
                <Plus className="h-4 w-4 mr-1.5" />
                Create Client
              </Link>
            </Button>
          </EmptyState>
        </div>
      ) : (
        <div className="rounded-xl border border-[#e2e0d9] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2e0d9] bg-[#faf9f6]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide">
                  Client
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide hidden sm:table-cell">
                  Slug
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide hidden md:table-cell">
                  Users
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide hidden lg:table-cell">
                  Created
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#8a8880] uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e0d9]">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-[#faf9f6] transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 text-[#263a2e]"
                        style={{
                          backgroundColor: client.brandSettings?.primaryColor ?? "#d3de2c",
                        }}
                      >
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="font-medium text-[#464540] hover:text-[#263a2e] transition-colors"
                        >
                          {client.name}
                        </Link>
                        {client.brandSettings?.portalName &&
                          client.brandSettings.portalName !== client.name && (
                            <p className="text-xs text-[#8a8880]">
                              {client.brandSettings.portalName}
                            </p>
                          )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <code className="text-xs text-[#8a8880] bg-[#f0efe9] px-1.5 py-0.5 rounded">
                      {client.slug}
                    </code>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1.5 text-[#8a8880]">
                      <Users className="h-3.5 w-3.5" />
                      <span>{client._count.clientUsers}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-[#8a8880]">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant="outline"
                      className={
                        client.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                          : "bg-gray-50 text-gray-500 border-gray-200 text-xs"
                      }
                    >
                      {client.isActive ? "Active" : "Archived"}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/admin/clients/${client.id}`}>
                      <ChevronRight className="h-4 w-4 text-[#cad1cc] group-hover:text-[#8a8880] transition-colors" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
