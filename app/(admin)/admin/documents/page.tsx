import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { DocumentStatusBadge } from "@/components/documents/DocumentStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { FileText, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function AdminDocumentsPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <PageHeader title="Documents" subtitle="All documents across every client." />

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload documents from a client's detail page."
        />
      ) : (
        <div className="divide-y divide-[#f0efe9] border border-[#e2e0d9] rounded-xl overflow-hidden">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-[#faf9f6] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#464540] truncate">{doc.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <Link href={`/admin/clients/${doc.client.id}/documents`}
                    className="text-xs text-[#8a8880] hover:text-[#464540] transition-colors">
                    {doc.client.name}
                  </Link>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
