import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { UpdateClientForm } from "@/components/admin/UpdateClientForm";
import { archiveClient, restoreClient } from "@/lib/actions/clients";
import { Users, ImageIcon, CheckSquare, FileText, Archive, RotateCcw } from "lucide-react";
import Link from "next/link";

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      _count: {
        select: { clientUsers: true, proofs: true, tasks: true, documents: true },
      },
    },
  });

  if (!client) notFound();

  const archiveClientWithId = archiveClient.bind(null, id);
  const restoreClientWithId = restoreClient.bind(null, id);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Users", value: client._count.clientUsers, icon: Users, href: `/admin/clients/${id}/users` },
          { label: "Proofs", value: client._count.proofs, icon: ImageIcon, href: `/admin/clients/${id}/proofs` },
          { label: "Tasks", value: client._count.tasks, icon: CheckSquare, href: `/admin/clients/${id}/tasks` },
          { label: "Documents", value: client._count.documents, icon: FileText, href: `/admin/clients/${id}/documents` },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide mb-1">
                        {stat.label}
                      </p>
                      <p className="font-heading text-2xl font-semibold text-[#464540]">
                        {stat.value}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#f0efe9] flex items-center justify-center">
                      <Icon className="h-4 w-4 text-[#8a8880]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Edit Name */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdateClientForm
            clientId={id}
            defaultName={client.name}
            slug={client.slug}
            createdAt={client.createdAt}
          />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-[#ff6b6c]/20">
        <CardHeader>
          <CardTitle className="text-[#ff6b6c]">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-[#464540]">
                {client.isActive ? "Archive this client" : "Restore this client"}
              </p>
              <p className="text-xs text-[#8a8880] mt-0.5">
                {client.isActive
                  ? "Archived clients are hidden from the portal. Users will lose access."
                  : "Restoring will re-enable the portal for all assigned users."}
              </p>
            </div>
            {client.isActive ? (
              <ConfirmAction
                trigger={
                  <Button
                    variant="outline"
                    className="border-[#ff6b6c]/30 text-[#ff6b6c] hover:bg-[#ff6b6c]/5 text-sm"
                  >
                    <Archive className="h-4 w-4 mr-1.5" />
                    Archive
                  </Button>
                }
                title="Archive this client?"
                description={`${client.name} will be archived and portal users will lose access. You can restore it at any time.`}
                actionLabel="Archive Client"
                destructive
                onConfirm={archiveClientWithId}
              />
            ) : (
              <form action={restoreClientWithId}>
                <Button
                  type="submit"
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Restore
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
