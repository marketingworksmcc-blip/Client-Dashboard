import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProofStatusBadge } from "@/components/proofs/ProofStatusBadge";
import { ProofViewer } from "@/components/proofs/ProofViewer";
import { ApprovalActions } from "@/components/proofs/ApprovalActions";
import { CommentThread } from "@/components/proofs/CommentThread";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { ArrowLeft, Calendar, Layers, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default async function ClientProofDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const proof = await prisma.proof.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { versionNum: "desc" } },
      comments: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
      approvals: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
    },
  });

  // Ensure the proof belongs to this client
  if (!proof || proof.clientId !== clientId) notFound();

  const latestVersion = proof.versions[0];
  const canAct = ["PENDING_REVIEW", "IN_REVIEW"].includes(proof.status);

  return (
    <div>
      <PageHeader title={proof.title} subtitle={proof.description ?? ""}>
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href="/proofs">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            All Proofs
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: viewer + comments */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {latestVersion ? `Version ${latestVersion.versionNum}` : "No file yet"}
                </CardTitle>
                <ProofStatusBadge status={proof.status} />
              </div>
              {latestVersion?.notes && (
                <p className="text-sm text-[#8a8880] mt-1">{latestVersion.notes}</p>
              )}
            </CardHeader>
            <CardContent>
              {latestVersion ? (
                <ProofViewer
                  fileUrl={latestVersion.fileUrl}
                  externalUrl={latestVersion.externalUrl}
                  fileName={latestVersion.fileName}
                  fileSize={latestVersion.fileSize}
                  mimeType={latestVersion.mimeType}
                  versionNum={latestVersion.versionNum}
                />
              ) : (
                <p className="text-sm text-[#8a8880]">No file has been uploaded yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Version history (if more than 1) */}
          {proof.versions.length > 1 && (
            <Card className="border-[#e2e0d9]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#8a8880]" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-[#f0efe9]">
                  {proof.versions.map((v) => (
                    <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-xs font-medium text-[#8a8880] w-6">v{v.versionNum}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#464540] truncate">{v.fileName ?? v.externalUrl ?? "—"}</p>
                        {v.notes && <p className="text-xs text-[#8a8880] mt-0.5">{v.notes}</p>}
                      </div>
                      <span className="text-xs text-[#8a8880] flex-shrink-0">{formatRelativeTime(v.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentThread proofId={id} comments={proof.comments} />
            </CardContent>
          </Card>
        </div>

        {/* Right: status + approval actions */}
        <div className="space-y-5">
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProofStatusBadge status={proof.status} />
              {proof.dueDate && (
                <div className="flex items-center gap-2 text-sm text-[#8a8880]">
                  <Calendar className="h-4 w-4" />
                  <span>Due {formatDate(proof.dueDate)}</span>
                </div>
              )}
              <p className="text-xs text-[#8a8880]">Uploaded {formatDate(proof.createdAt)}</p>
            </CardContent>
          </Card>

          {/* Approval actions — only shown when actionable */}
          {canAct && (
            <Card className="border-[#e2e0d9]">
              <CardHeader className="pb-3">
                <CardTitle>Your Response</CardTitle>
              </CardHeader>
              <CardContent>
                <ApprovalActions proofId={id} />
              </CardContent>
            </Card>
          )}

          {/* Approval history */}
          {proof.approvals.length > 0 && (
            <Card className="border-[#e2e0d9]">
              <CardHeader className="pb-3">
                <CardTitle>Approval History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {proof.approvals.map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    {a.action === "APPROVED" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#ff6b6c] mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-[#464540]">
                        {a.action === "APPROVED" ? "Approved" : "Changes Requested"}
                      </p>
                      {a.notes && <p className="text-xs text-[#8a8880] mt-0.5">{a.notes}</p>}
                      <p className="text-xs text-[#8a8880] mt-0.5">{formatRelativeTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
