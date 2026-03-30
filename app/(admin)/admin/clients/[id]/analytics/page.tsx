import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddReportForm } from "@/components/analytics/AddReportForm";
import { DeleteReportButton } from "@/components/analytics/DeleteReportButton";
import { ScorecardTable } from "@/components/analytics/ScorecardTable";
import { DataPointsManager } from "@/components/analytics/DataPointsManager";
import { ReportLinksManager } from "@/components/analytics/ReportLinksManager";
import { ExternalLink } from "lucide-react";

export default async function ClientAnalyticsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const [reports, dataPoints] = await Promise.all([
    prisma.analyticsReport.findMany({
      where: { clientId: id, isActive: true },
      orderBy: { createdAt: "desc" },
      include: { metrics: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.analyticsDataPoint.findMany({
      where: { clientId: id },
      orderBy: { date: "desc" },
    }),
  ]);

  const externalLinks = reports.filter((r) => r.reportType === "EXTERNAL_LINK");
  const otherReports = reports.filter((r) => r.reportType !== "EXTERNAL_LINK");

  const serializedDataPoints = dataPoints.map((dp) => ({
    ...dp,
    date: dp.date.toISOString(),
    createdAt: dp.createdAt.toISOString(),
    updatedAt: dp.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* ── Report Links (Looker Studio etc.) ── */}
      <Card className="border-[#e2e0d9]">
        <CardHeader className="pb-3">
          <CardTitle>Report Links</CardTitle>
          <p className="text-xs text-[#8a8880] mt-0.5">
            Add Looker Studio or other external report URLs. These appear as a prominent button on the client dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <ReportLinksManager
            clientId={id}
            links={externalLinks.map((r) => ({ id: r.id, title: r.title, reportUrl: r.reportUrl }))}
          />
        </CardContent>
      </Card>

      {/* ── Dashboard Metrics ── */}
      <Card className="border-[#e2e0d9]">
        <CardHeader className="pb-3">
          <CardTitle>Dashboard Metrics</CardTitle>
          <p className="text-xs text-[#8a8880] mt-0.5">
            Enter time-series data per metric type. These power the client-facing analytics dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <DataPointsManager clientId={id} dataPoints={serializedDataPoints} />
        </CardContent>
      </Card>

      {/* ── Embedded & Scorecard Reports ── */}
      {otherReports.length > 0 && (
        <div className="space-y-4">
          {otherReports.map((report) => (
            <Card key={report.id} className="border-[#e2e0d9]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <span className="text-xs text-[#8a8880] bg-[#f0efe9] px-2 py-0.5 rounded-full">
                      {report.reportType === "EMBEDDED" ? "Embedded" : "Scorecard"}
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
                {report.embedMode && report.reportUrl && (
                  <div className="rounded-lg overflow-hidden border border-[#e2e0d9] aspect-video">
                    <iframe src={report.reportUrl} className="w-full h-full" title={report.title} />
                  </div>
                )}
                {report.reportType === "MANUAL" && (
                  <ScorecardTable reportId={report.id} metrics={report.metrics} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add Embedded / Scorecard Report ── */}
      <Card className="border-[#e2e0d9]">
        <CardHeader className="pb-3">
          <CardTitle>Add Embedded or Scorecard Report</CardTitle>
        </CardHeader>
        <CardContent>
          <AddReportForm clientId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
