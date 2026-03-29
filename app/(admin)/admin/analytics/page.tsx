import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart2, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function AdminAnalyticsPage() {
  const reports = await prisma.analyticsReport.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { metrics: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Analytics" subtitle="All reports across every client." />

      {reports.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No reports configured"
          description="Add analytics reports from a client's detail page."
        />
      ) : (
        <div className="divide-y divide-[#f0efe9] border border-[#e2e0d9] rounded-xl overflow-hidden">
          {reports.map((report) => (
            <div key={report.id} className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-[#faf9f6] transition-colors">
              <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <BarChart2 className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#464540] truncate">{report.title}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <Link href={`/admin/clients/${report.client.id}/analytics`}
                    className="text-xs text-[#8a8880] hover:text-[#464540] transition-colors">
                    {report.client.name}
                  </Link>
                  <span className="text-xs text-[#8a8880]">
                    {report.reportType === "EXTERNAL_LINK" ? "Link"
                      : report.reportType === "EMBEDDED" ? "Embedded"
                      : `Manual · ${report._count.metrics} metrics`}
                  </span>
                </div>
              </div>
              {report.reportUrl && (
                <a href={report.reportUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[#8a8880] hover:text-[#464540] transition-colors flex-shrink-0">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
