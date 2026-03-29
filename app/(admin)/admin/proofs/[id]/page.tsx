import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProofStatusBadge } from "@/components/proofs/ProofStatusBadge";
import { ProofViewer } from "@/components/proofs/ProofViewer";
import { AddVersionForm } from "@/components/proofs/AddVersionForm";
import { CommentThread } from "@/components/proofs/CommentThread";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { archiveProof, setProofInReview, deleteProof } from "@/lib/actions/proofs";
import { ArrowLeft, Building2, Calendar, Layers, CheckCircle, XCircle } from "lucide-react";
import { DeleteProofButton } from "@/components/proofs/DeleteProofButton";
import Link from "next/link";

export default async function AdminProofDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await auth();

  const proof = await prisma.proof.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      versions: { orderBy: { versionNum: "desc" } },
      comments: { orderBy: { createdAt: "asc" }, include: { user: { select: { name: true } } } },
      approvals: { orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } },
    },
  });

  if (!proof) notFound();

  const latestVersion = proof.versions[0];
  const archiveWithId = archiveProof.bind(null, id);
  const markInReviewWithId = setProofInReview.bind(null, id);
  const deleteWithId = deleteProof.bind(null, id);

  return (
    <div>
      <PageHeader title={proof.title} subtitle={proof.description ?? ""}>
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href={`/admin/clients/${proof.client.id}/proofs`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to {proof.client.name}
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: viewer + versions */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>
                  {latestVersion ? `Version ${latestVersion.versionNum}` : "No versions yet"}
                </CardTitle>
                <ProofStatusBadge status={proof.status} />
              </div>
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
                <p className="text-sm text-[#8a8880]">No file uploaded yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Version history */}
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

        {/* Right: meta + actions */}
        <div className="space-y-5">
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[#8a8880]">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <Link href={`/admin/clients/${proof.client.id}`} className="hover:text-[#464540] transition-colors">
                  {proof.client.name}
                </Link>
              </div>
              {proof.dueDate && (
                <div className="flex items-center gap-2 text-[#8a8880]">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Due {formatDate(proof.dueDate)}</span>
                </div>
              )}
              <div className="pt-1">
                <p className="text-xs text-[#8a8880]">Created {formatDate(proof.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Admin actions */}
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {proof.status === "PENDING_REVIEW" && (
                <form action={markInReviewWithId}>
                  <Button type="submit" variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                    Mark as In Review
                  </Button>
                </form>
              )}
              {proof.status !== "ARCHIVED" && (
                <form action={archiveWithId}>
                  <Button type="submit" variant="outline"
                    className="w-full border-[#ff6b6c]/30 text-[#ff6b6c] hover:bg-[#ff6b6c]/5">
                    Archive Proof
                  </Button>
                </form>
              )}
              <DeleteProofButton proofTitle={proof.title} deleteAction={deleteWithId} />
            </CardContent>
          </Card>

          {/* Add new version */}
          {proof.status !== "ARCHIVED" && (
            <Card className="border-[#e2e0d9]">
              <CardHeader className="pb-3">
                <CardTitle>Upload New Version</CardTitle>
              </CardHeader>
              <CardContent>
                <AddVersionForm proofId={id} />
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
                        {a.action === "APPROVED" ? "Approved" : "Changes Requested"} by {a.user.name}
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
