import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { DeleteDocumentButton } from "@/components/documents/DeleteDocumentButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { deleteDocument } from "@/lib/actions/documents";
import { formatDate } from "@/lib/utils";
import { FileText, Plus, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function ClientDocumentsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const documents = await prisma.document.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]">
          <Link href={`/admin/clients/${id}/documents/new`}>
            <Plus className="h-4 w-4 mr-1.5" />
            Upload Document
          </Link>
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload documents for this client to access and reference."
        >
          <Button asChild className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]">
            <Link href={`/admin/clients/${id}/documents/new`}>
              <Plus className="h-4 w-4 mr-1.5" />
              Upload Document
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="divide-y divide-[#f0efe9] border border-[#e2e0d9] rounded-xl overflow-hidden">
          {documents.map((doc) => {
            const deleteWithId = deleteDocument.bind(null, doc.id);
            return (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-[#faf9f6] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#464540] truncate">{doc.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-[#8a8880]">{formatDate(doc.createdAt)}</span>
                    {doc.category && (
                      <span className="text-xs text-[#8a8880]">{doc.category}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <DocumentStatusBadge status={doc.status} />
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} download
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-[#e2e0d9] hover:bg-[#f0efe9] transition-colors">
                      <Download className="h-4 w-4 text-[#8a8880]" />
                    </a>
                  )}
                  {doc.externalUrl && (
                    <a href={doc.externalUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-[#e2e0d9] hover:bg-[#f0efe9] transition-colors">
                      <ExternalLink className="h-4 w-4 text-[#8a8880]" />
                    </a>
                  )}
                  <DeleteDocumentButton documentTitle={doc.title} deleteAction={deleteWithId} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
