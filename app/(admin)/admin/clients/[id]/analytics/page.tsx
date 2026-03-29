import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddReportForm } from "@/components/analytics/AddReportForm";
import { AddMetricForm } from "@/components/analytics/AddMetricForm";
import { DeleteReportButton } from "@/components/analytics/DeleteReportButton";
import { DeleteMetricButton } from "@/components/analytics/DeleteMetricButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart2, ExternalLink } from "lucide-react";

export default async function ClientAnalyticsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const reports = await prisma.analyticsReport.findMany({
    where: { clientId: id, isActive: true },
    orderBy: { createdAt: "desc" },
    include: { metrics: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="space-y-5">
      {/* Existing reports */}
      {reports.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No reports yet"
          description="Add an analytics report link or enter manual metrics below."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="border-[#e2e0d9]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <span className="text-xs text-[#8a8880] bg-[#f0efe9] px-2 py-0.5 rounded-full">
                      {report.reportType === "EXTERNAL_LINK" ? "Link"
                        : report.reportType === "EMBEDDED" ? "Embedded"
                        : "Manual"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.reportUrl && (
                      <a href={report.reportUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[#8a8880] hover:text-[#464540] transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <DeleteReportButton reportId={report.id} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Embedded iframe */}
                {report.embedMode && report.reportUrl && (
                  <div className="rounded-lg overflow-hidden border border-[#e2e0d9] aspect-video">
                    <iframe src={report.reportUrl} className="w-full h-full" title={report.title} />
                  </div>
                )}

                {/* Manual metrics */}
                {report.reportType === "MANUAL" && (
                  <>
                    {report.metrics.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {report.metrics.map((m) => (
                          <div key={m.id} className="relative bg-[#f0efe9]/60 rounded-lg px-4 py-3 pr-8">
                            <div className="absolute top-2 right-2">
                              <DeleteMetricButton metricId={m.id} />
                            </div>
                            <p className="text-xs text-[#8a8880] mb-0.5">{m.metricName}</p>
                            <p className="text-xl font-heading font-semibold text-[#464540]">{m.metricValue}</p>
                            {m.notes && <p className="text-xs text-[#8a8880] mt-0.5">{m.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-[#f0efe9] pt-3">
                      <p className="text-xs font-medium text-[#8a8880] mb-2">Add Metric</p>
                      <AddMetricForm reportId={report.id} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add new report */}
      <Card className="border-[#e2e0d9]">
        <CardHeader className="pb-3">
          <CardTitle>Add Report</CardTitle>
        </CardHeader>
        <CardContent>
          <AddReportForm clientId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
