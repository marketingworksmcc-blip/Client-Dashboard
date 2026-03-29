import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart2, ExternalLink } from "lucide-react";

export default async function ClientAnalyticsPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const reports = clientId
    ? await prisma.analyticsReport.findMany({
        where: { clientId, isActive: true },
        orderBy: { createdAt: "desc" },
        include: { metrics: { orderBy: { createdAt: "asc" } } },
      })
    : [];

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Performance reports and metrics from Revel." />

      {reports.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No reports yet"
          description="Your Revel team will share performance reports and metrics here."
        />
      ) : (
        <div className="space-y-5">
          {reports.map((report) => (
            <Card key={report.id} className="border-[#e2e0d9]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  {report.reportUrl && report.reportType === "EXTERNAL_LINK" && (
                    <a href={report.reportUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#263a2e] hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Report
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Embedded iframe */}
                {report.embedMode && report.reportUrl && (
                  <div className="rounded-lg overflow-hidden border border-[#e2e0d9] aspect-video">
                    <iframe src={report.reportUrl} className="w-full h-full" title={report.title} />
                  </div>
                )}

                {/* Manual metrics grid */}
                {report.reportType === "MANUAL" && report.metrics.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {report.metrics.map((m) => (
                      <div key={m.id} className="bg-[#f0efe9]/60 rounded-lg px-4 py-3">
                        <p className="text-xs text-[#8a8880] mb-0.5">{m.metricName}</p>
                        <p className="text-xl font-heading font-semibold text-[#464540]">{m.metricValue}</p>
                        {m.notes && <p className="text-xs text-[#8a8880] mt-0.5">{m.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {report.reportType === "MANUAL" && report.metrics.length === 0 && (
                  <p className="text-sm text-[#8a8880]">No metrics added yet.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
