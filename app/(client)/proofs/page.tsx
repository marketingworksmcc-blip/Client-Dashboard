import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProofStatusBadge } from "@/components/proofs/ProofStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { ImageIcon, Layers, Calendar } from "lucide-react";
import Link from "next/link";

export default async function ClientProofsPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const proofs = clientId
    ? await prisma.proof.findMany({
        where: { clientId, status: { not: "ARCHIVED" } },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { versions: true, comments: true } } },
      })
    : [];

  return (
    <div>
      <PageHeader title="Proofs" subtitle="Review and approve creative work from Revel." />

      {proofs.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No proofs yet"
          description="Creative proofs from your Revel team will appear here for review."
        />
      ) : (
        <div className="divide-y divide-[#f0efe9] border border-[#e2e0d9] rounded-xl overflow-hidden bg-white">
          {proofs.map((proof) => (
            <Link
              key={proof.id}
              href={`/proofs/${proof.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-[#faf9f6] transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#464540] truncate">{proof.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-[#8a8880]">{formatDate(proof.createdAt)}</span>
                  {proof.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-[#8a8880]">
                      <Calendar className="h-3 w-3" />
                      Due {formatDate(proof.dueDate)}
                    </span>
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
