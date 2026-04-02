import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/analytics/StatCard";
import { ChartCard } from "@/components/analytics/ChartCard";
import { KeyEventsPieChart } from "@/components/analytics/KeyEventsPieChart";
import { MetaCampaignPieChart } from "@/components/analytics/MetaCampaignPieChart";
import { GoogleAdsCampaignPieChart } from "@/components/analytics/GoogleAdsCampaignPieChart";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart2, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import type { KeyEventSource } from "@/lib/actions/ga4";
import type { CampaignDataPoint } from "@/lib/actions/meta";
import type { AdsCampaignDataPoint } from "@/lib/actions/googleAds";
import { formatRelativeTime } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────

export default async function ClientAnalyticsPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const [client, clientMetrics, reports, ga4Config, metaConfig, googleAdsConfig] = await Promise.all([
    clientId
      ? prisma.client.findUnique({
          where: { id: clientId },
          select: {
            analyticsMode: true,
            googleSheetConfig: {
              select: { lastSyncedAt: true, lastSyncError: true, syncedRowCount: true },
            },
          },
        })
      : Promise.resolve(null),
    clientId
      ? prisma.clientMetric.findMany({
          where: { clientId },
          orderBy: { sortOrder: "asc" },
          include: { dataPoints: { orderBy: { date: "asc" } } },
        })
      : Promise.resolve([]),
    clientId
      ? prisma.analyticsReport.findMany({
          where: { clientId, isActive: true },
          orderBy: { createdAt: "desc" },
          include: { metrics: { orderBy: { createdAt: "asc" } } },
        })
      : Promise.resolve([]),
    clientId
      ? prisma.gA4Config.findUnique({
          where: { clientId },
          select: { keyEventName: true, keyEventsData: true, enabled: true },
        })
      : Promise.resolve(null),
    clientId
      ? prisma.metaConfig.findUnique({
          where: { clientId },
          select: { campaignData: true, enabled: true },
        })
      : Promise.resolve(null),
    clientId
      ? prisma.googleAdsConfig.findUnique({
          where: { clientId },
          select: { campaignData: true, enabled: true },
        })
      : Promise.resolve(null),
  ]);

  const analyticsMode = client?.analyticsMode ?? "MANUAL";
  const sheetConfig = client?.googleSheetConfig ?? null;
  const keyEventsData = (ga4Config?.enabled && ga4Config?.keyEventsData
    ? ga4Config.keyEventsData
    : []) as unknown as KeyEventSource[];
  const keyEventName = ga4Config?.enabled ? (ga4Config?.keyEventName ?? null) : null;
  const metaCampaignData = (metaConfig?.enabled && metaConfig?.campaignData
    ? metaConfig.campaignData
    : []) as unknown as CampaignDataPoint[];
  const googleAdsCampaignData = (googleAdsConfig?.enabled && googleAdsConfig?.campaignData
    ? googleAdsConfig.campaignData
    : []) as unknown as AdsCampaignDataPoint[];

  const cardMetrics = clientMetrics.filter((m) => m.showAsCard);
  const chartMetrics = clientMetrics.filter((m) => m.showAsChart);
  const hasMetricData = clientMetrics.some((m) => m.dataPoints.length > 0);

  const externalLinks = reports.filter((r) => r.reportType === "EXTERNAL_LINK" && r.reportUrl);
  const otherReports = reports.filter((r) => r.reportType !== "EXTERNAL_LINK");
  const isEmpty = !hasMetricData && reports.length === 0 && externalLinks.length === 0;

  return (
    <div>
      <PageHeader title="Analytics" subtitle="Performance metrics and trends from Revel." />

      {/* ── Google Sheet sync status banner ── */}
      {analyticsMode === "GOOGLE_SHEET" && sheetConfig && (
        <div className="mb-6 space-y-2">
          {sheetConfig.lastSyncError && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm">
              <AlertTriangle className="h-4 w-4 text-[#ff6b6c] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#ff6b6c]">Last sync failed</p>
                <p className="text-xs text-[#8a8880] mt-0.5">{sheetConfig.lastSyncError}</p>
                {hasMetricData && (
                  <p className="text-xs text-[#8a8880] mt-0.5">Showing previously synced data below.</p>
                )}
              </div>
            </div>
          )}
          {sheetConfig.lastSyncedAt && !sheetConfig.lastSyncError && (
            <div className="flex items-center gap-1.5 text-xs text-[#8a8880]">
              <RefreshCw className="h-3 w-3" />
              Last synced from Google Sheets {formatRelativeTime(new Date(sheetConfig.lastSyncedAt))}
              {sheetConfig.syncedRowCount !== null && (
                <span className="text-[#cad1cc]">
                  &nbsp;· {sheetConfig.syncedRowCount} data point{sheetConfig.syncedRowCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
          {!sheetConfig.lastSyncedAt && (
            <div className="flex items-center gap-1.5 text-xs text-[#8a8880]">
              <RefreshCw className="h-3 w-3" />
              Google Sheet connected — awaiting first sync by your Revel team.
            </div>
          )}
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          icon={BarChart2}
          title="No analytics data yet"
          description={
            analyticsMode === "GOOGLE_SHEET"
              ? "Your Revel team has connected a Google Sheet. Data will appear after the first sync."
              : "Your Revel team will populate this dashboard with performance metrics over time."
          }
        />
      ) : (
        <div className="space-y-6">
          {/* ── Report Links (Looker Studio etc.) ── */}
          {externalLinks.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {externalLinks.map((link) => (
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

          {/* ── Summary stat cards ── */}
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

          {/* ── Charts + pie charts ── */}
          {(chartMetrics.filter((m) => m.dataPoints.length > 0).length > 0 ||
            (keyEventName && keyEventsData.length > 0) ||
            metaCampaignData.length > 0 ||
            googleAdsCampaignData.length > 0) && (
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
            </div>
          )}

          {/* ── Embedded & Scorecard Reports ── */}
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
  );
}
