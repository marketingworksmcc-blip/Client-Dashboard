import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MetricsManager } from "@/components/analytics/MetricsManager";
import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { ReportLinksManager } from "@/components/analytics/ReportLinksManager";
import { AnalyticsDataGrid, type GridMetric, type GridRow } from "@/components/analytics/AnalyticsDataGrid";
import { FunnelConfigForm } from "@/components/analytics/FunnelConfigForm";
import { FunnelChannelPieChart } from "@/components/analytics/FunnelChannelPieChart";
import { GA4ConfigForm } from "@/components/analytics/GA4ConfigForm";
import { StatCard } from "@/components/analytics/StatCard";
import { ChartCard } from "@/components/analytics/ChartCard";
import { KeyEventsPieChart } from "@/components/analytics/KeyEventsPieChart";
import { MetaConfigForm } from "@/components/analytics/MetaConfigForm";
import { MetaCampaignPieChart } from "@/components/analytics/MetaCampaignPieChart";
import { GoogleAdsConfigForm } from "@/components/analytics/GoogleAdsConfigForm";
import { GoogleAdsCampaignPieChart } from "@/components/analytics/GoogleAdsCampaignPieChart";
import { AnalyticsTable } from "@/components/analytics/AnalyticsTable";
import { EmptyState } from "@/components/shared/EmptyState";
import type { KeyEventSource } from "@/lib/actions/ga4";
import type { MetaMetricMapping, CampaignDataPoint } from "@/lib/actions/meta";
import type { GoogleAdsMetricMapping, AdsCampaignDataPoint } from "@/lib/actions/googleAds";
import Link from "next/link";
import { LayoutDashboard, Table2, Eye, ExternalLink, BarChart2 } from "lucide-react";
import type { FunnelMetricMapping, FunnelChannelDataPoint } from "@/lib/actions/funnel";
import type { GA4MetricMapping } from "@/lib/actions/ga4";

function computeStat(dataPoints: { date: Date | string; value: number }[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  const current = dataPoints
    .filter((p) => new Date(p.date) >= thirtyDaysAgo)
    .reduce((s, p) => s + p.value, 0);
  const previous = dataPoints
    .filter((p) => new Date(p.date) >= sixtyDaysAgo && new Date(p.date) < thirtyDaysAgo)
    .reduce((s, p) => s + p.value, 0);

  const change = previous === 0 ? null : ((current - previous) / previous) * 100;
  return { value: current, change };
}

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
  const isClientView = view === "client";

  const [externalReports, metrics, funnelConfig, ga4Config, metaConfig, googleAdsConfig, allReports, upcomingTasks] =
    await Promise.all([
      prisma.analyticsReport.findMany({
        where: { clientId: id, isActive: true, reportType: "EXTERNAL_LINK" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.clientMetric.findMany({
        where: { clientId: id },
        orderBy: { sortOrder: "asc" },
        include: { dataPoints: { orderBy: { date: "asc" } } },
      }),
      prisma.funnelConfig.findUnique({ where: { clientId: id } }),
      prisma.gA4Config.findUnique({ where: { clientId: id } }),
      prisma.metaConfig.findUnique({ where: { clientId: id } }),
      prisma.googleAdsConfig.findUnique({ where: { clientId: id } }),
      prisma.analyticsReport.findMany({
        where: { clientId: id, isActive: true },
        orderBy: { createdAt: "desc" },
        include: { metrics: { orderBy: { createdAt: "asc" } } },
      }),
      prisma.task.findMany({
        where: {
          clientId: id,
          dueDate: { not: null },
          status: { notIn: ["COMPLETED", "ARCHIVED"] },
        },
        orderBy: { dueDate: "asc" },
        take: 8,
        include: { assignedTo: { select: { name: true, email: true } } },
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

  // Client view data
  const cardMetrics = metrics.filter((m) => m.showAsCard);
  const chartMetrics = metrics.filter((m) => m.showAsChart);
  const hasMetricData = metrics.some((m) => m.dataPoints.length > 0);
  const clientExternalLinks = allReports.filter((r) => r.reportType === "EXTERNAL_LINK" && r.reportUrl);
  const otherReports = allReports.filter((r) => r.reportType !== "EXTERNAL_LINK");
  const isEmpty = !hasMetricData && allReports.length === 0;
  const keyEventsData = (ga4Config?.keyEventsData ?? []) as unknown as KeyEventSource[];
  const keyEventName = ga4Config?.keyEventName ?? null;
  const metaCampaignData = (metaConfig?.campaignData ?? []) as unknown as CampaignDataPoint[];
  const googleAdsCampaignData = (googleAdsConfig?.campaignData ?? []) as unknown as AdsCampaignDataPoint[];
  const funnelChannelData = (funnelConfig?.enabled && funnelConfig?.channelData
    ? funnelConfig.channelData
    : []) as unknown as FunnelChannelDataPoint[];
  const taskRows = upcomingTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    dueDate: t.dueDate,
    assignedToName: t.assignedTo?.name ?? null,
    assignedToEmail: t.assignedTo?.email ?? null,
    clientId: t.clientId,
  }));

  return (
    <div className="space-y-6">

      {/* ── View Toggle ── */}
      <div className="flex items-center gap-1 p-1 bg-[#f0efe9] rounded-lg w-fit">
        <Link
          href={baseUrl}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            !isGrid && !isClientView
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
        <Link
          href={`${baseUrl}?view=client`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            isClientView
              ? "bg-white text-[#263a2e] shadow-sm"
              : "text-[#8a8880] hover:text-[#464540]"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          Client View
        </Link>
      </div>

      {isGrid ? (
        /* ── Grid View ── */
        <>
          <CollapsibleCard
            title="Dashboard Metrics"
            description="Define custom metrics and enter time-series data. These power the client-facing analytics dashboard."
            defaultOpen={false}
          >
            <MetricsManager clientId={id} metrics={serializedMetrics} />
          </CollapsibleCard>

          <CollapsibleCard
            title="Analytics Data Grid"
            description="Enter, edit, and manage metric data points. Changes are saved in bulk — click Save when done."
            defaultOpen={false}
          >
            <AnalyticsDataGrid
              clientId={id}
              metrics={gridMetrics}
              initialRows={gridRows}
            />
          </CollapsibleCard>
        </>
      ) : isClientView ? (
        /* ── Client View ── */
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f0efe9] border border-[#e2e0d9] text-xs text-[#8a8880] w-fit">
            <Eye className="h-3.5 w-3.5" />
            This is a preview of what the client sees on their analytics page.
          </div>

          {isEmpty ? (
            <EmptyState
              icon={BarChart2}
              title="No analytics data yet"
              description="Add metrics and data points in Dashboard View, then they will appear here."
            />
          ) : (
            <div className="space-y-6">
              {/* External report links */}
              {clientExternalLinks.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {clientExternalLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.reportUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      {link.title}
                    </a>
                  ))}
                </div>
              )}

              {/* Stat cards */}
              {cardMetrics.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {cardMetrics.map((m) => {
                    const stat = computeStat(m.dataPoints);
                    return (
                      <StatCard
                        key={m.id}
                        label={m.name}
                        value={stat.value.toLocaleString()}
                        change={stat.change}
                        changeLabel="vs last month"
                      />
                    );
                  })}
                </div>
              )}

              {/* Charts + pie charts */}
              {(chartMetrics.filter((m) => m.dataPoints.length > 0).length > 0 ||
                (keyEventName && keyEventsData.length > 0) ||
                metaCampaignData.length > 0 ||
                googleAdsCampaignData.length > 0 ||
                funnelChannelData.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {chartMetrics
                    .filter((m) => m.dataPoints.length > 0)
                    .map((m) => (
                      <ChartCard
                        key={m.id}
                        title={m.name}
                        data={m.dataPoints.map((dp) => ({
                          date: dp.date.toISOString(),
                          value: dp.value,
                        }))}
                        color={m.color}
                      />
                    ))}
                  {keyEventName && (
                    <KeyEventsPieChart data={keyEventsData} keyEventName={keyEventName} />
                  )}
                  {metaCampaignData.length > 0 && (
                    <MetaCampaignPieChart data={metaCampaignData} />
                  )}
                  {googleAdsCampaignData.length > 0 && (
                    <GoogleAdsCampaignPieChart data={googleAdsCampaignData} />
                  )}
                  {funnelChannelData.length > 0 && (
                    <FunnelChannelPieChart data={funnelChannelData} />
                  )}
                </div>
              )}

              {/* Embedded & scorecard reports */}
              {otherReports.length > 0 && (
                <div className="space-y-4">
                  {otherReports.map((report) => (
                    <div key={report.id} className="bg-white border border-[#e2e0d9] rounded-xl shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0efe9]">
                        <p className="text-sm font-semibold text-[#1a1a18]">{report.title}</p>
                      </div>
                      <div className="p-5">
                        {report.embedMode && report.reportUrl && (
                          <div className="rounded-lg overflow-hidden border border-[#e2e0d9] aspect-video">
                            <iframe src={report.reportUrl} className="w-full h-full" title={report.title} />
                          </div>
                        )}
                        {report.reportType === "MANUAL" && report.metrics.length > 0 && (
                          <div className="border border-[#e2e0d9] rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                              <div className="grid grid-cols-[2fr_1fr_2fr] min-w-[360px] bg-[#f0efe9] px-4 py-2.5 border-b border-[#e2e0d9]">
                                <span className="text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Metric</span>
                                <span className="text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Value</span>
                                <span className="text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Notes</span>
                              </div>
                              <div className="divide-y divide-[#f0efe9] bg-white">
                                {report.metrics.map((m) => (
                                  <div key={m.id} className="grid grid-cols-[2fr_1fr_2fr] min-w-[360px] gap-2 px-4 py-3 items-center">
                                    <span className="text-sm text-[#464540] font-medium">{m.metricName}</span>
                                    <span className="text-sm font-semibold text-[#263a2e] tabular-nums">{m.metricValue}</span>
                                    <span className="text-xs text-[#8a8880]">{m.notes ?? ""}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        {report.reportType === "MANUAL" && report.metrics.length === 0 && (
                          <p className="text-sm text-[#8a8880]">No metrics added yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Dashboard View ── */
        <>
          <CollapsibleCard
            title="Report Links"
            description="Add Looker Studio or other external report URLs. These appear as a prominent button on the client dashboard."
            defaultOpen={false}
          >
            <ReportLinksManager
              clientId={id}
              links={externalReports.map((r) => ({ id: r.id, title: r.title, reportUrl: r.reportUrl }))}
            />
          </CollapsibleCard>

          <CollapsibleCard
            title="Google Analytics 4"
            description="Connect a GA4 property via service account to sync metrics automatically."
            defaultOpen={false}
          >
            <GA4ConfigForm
              clientId={id}
              metrics={metrics.map((m) => ({ id: m.id, name: m.name }))}
              config={
                ga4Config
                  ? {
                      enabled: ga4Config.enabled,
                      propertyId: ga4Config.propertyId,
                      serviceAccountJson: ga4Config.serviceAccountJson,
                      mappings: ga4Config.mappings as unknown as GA4MetricMapping[],
                      lastSyncedAt: ga4Config.lastSyncedAt?.toISOString() ?? null,
                      lastSyncError: ga4Config.lastSyncError,
                    }
                  : null
              }
            />
          </CollapsibleCard>

          <CollapsibleCard
            title="Google Ads"
            description="Connect a Google Ads account via service account to sync campaign metrics automatically."
            defaultOpen={false}
          >
            <GoogleAdsConfigForm
              clientId={id}
              metrics={metrics.map((m) => ({ id: m.id, name: m.name }))}
              config={
                googleAdsConfig
                  ? {
                      enabled: googleAdsConfig.enabled,
                      customerId: googleAdsConfig.customerId,
                      developerToken: googleAdsConfig.developerToken,
                      serviceAccountJson: googleAdsConfig.serviceAccountJson,
                      mappings: googleAdsConfig.mappings as unknown as GoogleAdsMetricMapping[],
                      lastSyncedAt: googleAdsConfig.lastSyncedAt?.toISOString() ?? null,
                      lastSyncError: googleAdsConfig.lastSyncError,
                    }
                  : null
              }
            />
          </CollapsibleCard>

          <CollapsibleCard
            title="Meta Ads"
            description="Connect a Meta Ads account to sync Facebook & Instagram campaign metrics automatically."
            defaultOpen={false}
          >
            <MetaConfigForm
              clientId={id}
              metrics={metrics.map((m) => ({ id: m.id, name: m.name }))}
              config={
                metaConfig
                  ? {
                      enabled: metaConfig.enabled,
                      adAccountId: metaConfig.adAccountId,
                      accessToken: metaConfig.accessToken,
                      mappings: metaConfig.mappings as unknown as MetaMetricMapping[],
                      lastSyncedAt: metaConfig.lastSyncedAt?.toISOString() ?? null,
                      lastSyncError: metaConfig.lastSyncError,
                    }
                  : null
              }
            />
          </CollapsibleCard>

          <CollapsibleCard
            title="Funnel.io"
            description="Connect a Funnel.io account to sync aggregated marketing metrics and channel spend breakdown."
            defaultOpen={false}
          >
            <FunnelConfigForm
              clientId={id}
              metrics={metrics.map((m) => ({ id: m.id, name: m.name }))}
              config={
                funnelConfig
                  ? {
                      enabled: funnelConfig.enabled,
                      apiKey: funnelConfig.apiKey,
                      accountId: funnelConfig.accountId,
                      mappings: funnelConfig.mappings as unknown as FunnelMetricMapping[],
                      lastSyncedAt: funnelConfig.lastSyncedAt?.toISOString() ?? null,
                      lastSyncError: funnelConfig.lastSyncError,
                    }
                  : null
              }
            />
          </CollapsibleCard>
        </>
      )}

    </div>
  );
}
