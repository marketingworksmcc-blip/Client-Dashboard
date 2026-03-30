import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsManager } from "@/components/analytics/MetricsManager";
import { ReportLinksManager } from "@/components/analytics/ReportLinksManager";

export default async function ClientAnalyticsTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const [externalReports, metrics] = await Promise.all([
    prisma.analyticsReport.findMany({
      where: { clientId: id, isActive: true, reportType: "EXTERNAL_LINK" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.clientMetric.findMany({
      where: { clientId: id },
      orderBy: { sortOrder: "asc" },
      include: { dataPoints: { orderBy: { date: "desc" } } },
    }),
  ]);

  const serializedMetrics = metrics.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    dataPoints: m.dataPoints.map((dp) => ({
      ...dp,
      date: dp.date.toISOString(),
      createdAt: dp.createdAt.toISOString(),
      updatedAt: dp.updatedAt.toISOString(),
    })),
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
            links={externalReports.map((r) => ({ id: r.id, title: r.title, reportUrl: r.reportUrl }))}
          />
        </CardContent>
      </Card>

      {/* ── Dashboard Metrics ── */}
      <Card className="border-[#e2e0d9]">
        <CardHeader className="pb-3">
          <CardTitle>Dashboard Metrics</CardTitle>
          <p className="text-xs text-[#8a8880] mt-0.5">
            Define custom metrics and enter time-series data. These power the client-facing analytics dashboard.
          </p>
        </CardHeader>
        <CardContent>
          <MetricsManager clientId={id} metrics={serializedMetrics} />
        </CardContent>
      </Card>

    </div>
  );
}
