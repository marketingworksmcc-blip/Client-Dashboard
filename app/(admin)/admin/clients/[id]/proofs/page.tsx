import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProofStatusBadge } from "@/components/proofs/ProofStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { ImageIcon, Plus, Layers } from "lucide-react";
import Link from "next/link";

export default async function ClientProofsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const proofs = await prisma.proof.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { versions: true, comments: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]">
          <Link href={`/admin/clients/${id}/proofs/new`}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Proof
          </Link>
        </Button>
      </div>

      {proofs.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No proofs yet"
          description="Upload creative proofs for this client to review and approve."
        >
          <Button asChild className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]">
            <Link href={`/admin/clients/${id}/proofs/new`}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Proof
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="divide-y divide-[#f0efe9] border border-[#e2e0d9] rounded-xl overflow-hidden">
          {proofs.map((proof) => (
            <Link
              key={proof.id}
              href={`/admin/proofs/${proof.id}`}
              className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-[#faf9f6] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#464540] truncate">{proof.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-[#8a8880]">{formatDate(proof.createdAt)}</span>
                  {proof.dueDate && (
                    <span className="text-xs text-[#8a8880]">Due {formatDate(proof.dueDate)}</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-[#8a8880]">
                    <Layers className="h-3 w-3" />
                    {proof._count.versions}v
                  </span>
                </div>
              </div>
              <ProofStatusBadge status={proof.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
