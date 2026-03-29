import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ClientDetailNav } from "@/components/admin/ClientDetailNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ClientDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      brandSettings: true,
      _count: { select: { clientUsers: true, proofs: true, tasks: true, documents: true } },
    },
  });

  if (!client) notFound();

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-[#263a2e]"
            style={{ backgroundColor: client.brandSettings?.primaryColor ?? "#d3de2c" }}
          >
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-semibold text-[#464540] tracking-tight">
                {client.name}
              </h1>
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
            </div>
            <p className="text-sm text-[#8a8880]">
              <code className="text-xs bg-[#f0efe9] px-1.5 py-0.5 rounded">{client.slug}</code>
            </p>
          </div>
        </div>
        <Button variant="outline" asChild className="text-sm border-[#e2e0d9]">
          <Link href="/admin/clients">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            All Clients
          </Link>
        </Button>
      </div>

      <ClientDetailNav clientId={id} />

      <div className="mt-6">{children}</div>
    </div>
  );
}
