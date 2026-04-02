import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsManager } from "@/components/analytics/MetricsManager";
import { ReportLinksManager } from "@/components/analytics/ReportLinksManager";
import { AnalyticsDataGrid, type GridMetric, type GridRow } from "@/components/analytics/AnalyticsDataGrid";
import Link from "next/link";
import { LayoutDashboard, Table2 } from "lucide-react";

export default async function ClientAnalyticsTab({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ id }, { view }] = await Promise.all([params, searchParams]);

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const isGrid = view === "grid";

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

  // Build grid data when in grid view
  const gridMetrics: GridMetric[] = metrics.map((m) => ({ id: m.id, name: m.name, color: m.color }));
  const gridRows: GridRow[] = isGrid
    ? metrics.flatMap((m) =>
        m.dataPoints.map((dp) => ({
          rowId: dp.id,
          id: dp.id,
          metricId: m.id,
          date: dp.date.toISOString().split("T")[0],
          value: dp.value,
          notes: dp.notes ?? "",
          _dirty: false,
          _isNew: false,
        }))
      )
    : [];

  const baseUrl = `/admin/clients/${id}/analytics`;

  return (
    <div className="space-y-6">

      {/* ── View Toggle ── */}
      <div className="flex items-center gap-1 p-1 bg-[#f0efe9] rounded-lg w-fit">
        <Link
          href={baseUrl}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            !isGrid
              ? "bg-white text-[#263a2e] shadow-sm"
              : "text-[#8a8880] hover:text-[#464540]"
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          Dashboard View
        </Link>
        <Link
          href={`${baseUrl}?view=grid`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            isGrid
              ? "bg-white text-[#263a2e] shadow-sm"
              : "text-[#8a8880] hover:text-[#464540]"
          }`}
        >
          <Table2 className="h-3.5 w-3.5" />
          Data Grid
        </Link>
      </div>

      {isGrid ? (
        /* ── Grid View ── */
        <Card className="border-[#e2e0d9]">
          <CardHeader className="pb-3">
            <CardTitle>Analytics Data Grid</CardTitle>
            <p className="text-xs text-[#8a8880] mt-0.5">
              Enter, edit, and manage metric data points. Changes are saved in bulk — click Save when done.
            </p>
          </CardHeader>
          <CardContent>
            <AnalyticsDataGrid
              clientId={id}
              metrics={gridMetrics}
              initialRows={gridRows}
            />
          </CardContent>
        </Card>
      ) : (
        /* ── Dashboard View ── */
        <>
          {/* Report Links */}
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

          {/* Dashboard Metrics */}
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
        </>
      )}

    </div>
  );
}
