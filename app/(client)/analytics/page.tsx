import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/analytics/StatCard";
import { ChartCard } from "@/components/analytics/ChartCard";
import { AnalyticsTable } from "@/components/analytics/AnalyticsTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { BarChart2, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import type { MetricType } from "@prisma/client";

// ── Helpers ──────────────────────────────────────────────────

function computeStat(
  metricType: MetricType,
  allPoints: { metricType: MetricType; date: Date | string; value: number }[]
) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  const forMetric = allPoints.filter((p) => p.metricType === metricType);
  const current = forMetric
    .filter((p) => new Date(p.date) >= thirtyDaysAgo)
    .reduce((s, p) => s + p.value, 0);
  const previous = forMetric
    .filter((p) => new Date(p.date) >= sixtyDaysAgo && new Date(p.date) < thirtyDaysAgo)
    .reduce((s, p) => s + p.value, 0);

  const change = previous === 0 ? null : ((current - previous) / previous) * 100;
  return { value: current, change };
}

function toChartData(
  allPoints: { metricType: MetricType; date: Date | string; value: number }[],
  metricType: MetricType
) {
  return allPoints
    .filter((p) => p.metricType === metricType)
    .map((p) => ({ date: new Date(p.date).toISOString(), value: p.value }));
}

// ─────────────────────────────────────────────────────────────

export default async function ClientAnalyticsPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const [client, dataPoints, upcomingTasks, reports] = await Promise.all([
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
      ? prisma.analyticsDataPoint.findMany({
          where: { clientId },
          orderBy: { date: "asc" },
        })
      : Promise.resolve([]),
    clientId
      ? prisma.task.findMany({
          where: {
            clientId,
            dueDate: { not: null },
            status: { notIn: ["COMPLETED", "ARCHIVED"] },
          },
          orderBy: { dueDate: "asc" },
          take: 8,
          include: {
            assignedTo: { select: { name: true, email: true } },
          },
        })
      : Promise.resolve([]),
    clientId
      ? prisma.analyticsReport.findMany({
          where: { clientId, isActive: true },
          orderBy: { createdAt: "desc" },
          include: { metrics: { orderBy: { createdAt: "asc" } } },
        })
      : Promise.resolve([]),
  ]);

  const analyticsMode = client?.analyticsMode ?? "MANUAL";
  const sheetConfig = client?.googleSheetConfig ?? null;

  const hasAnyData = dataPoints.length > 0;
  const externalLinks = reports.filter((r) => r.reportType === "EXTERNAL_LINK" && r.reportUrl);
  const otherReports = reports.filter((r) => r.reportType !== "EXTERNAL_LINK");

  // Summary stats
  const onboarded = computeStat("CLIENTS_ONBOARDED", dataPoints);
  const totalClients = computeStat("TOTAL_CLIENTS", dataPoints);
  const newLeads = computeStat("NEW_LEADS", dataPoints);
  const avgHours = computeStat("AVG_HOURS", dataPoints);

  // Chart data (serialize dates)
  const tasksCreatedData = toChartData(dataPoints, "TASKS_CREATED");
  const tasksCompletedData = toChartData(dataPoints, "TASKS_COMPLETED");
  const newLeadsData = toChartData(dataPoints, "NEW_LEADS");

  // Upcoming tasks
  const taskRows = upcomingTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    dueDate: t.dueDate,
    assignedToName: t.assignedTo?.name ?? null,
    assignedToEmail: t.assignedTo?.email ?? null,
    clientId: t.clientId,
  }));

  const isEmpty = !hasAnyData && reports.length === 0 && externalLinks.length === 0;

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
                {hasAnyData && (
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

          {/* ── Row 1: Summary stat cards ── */}
          {hasAnyData && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Clients Onboarded"
                value={onboarded.value.toLocaleString()}
                change={onboarded.change}
                changeLabel="vs last month"
              />
              <StatCard
                label="Total Clients"
                value={totalClients.value.toLocaleString()}
                change={totalClients.change}
                changeLabel="vs last month"
              />
              <StatCard
                label="New Leads"
                value={newLeads.value.toLocaleString()}
                change={newLeads.change}
                changeLabel="vs last month"
              />
              <StatCard
                label="Avg Working Hours"
                value={avgHours.value.toLocaleString()}
                change={avgHours.change}
                changeLabel="vs last month"
                suffix="hrs"
              />
            </div>
          )}

          {/* ── Row 2: Charts ── */}
          {(tasksCreatedData.length > 0 || tasksCompletedData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ChartCard
                title="New Tasks Created"
                data={tasksCreatedData}
                color="#263a2e"
              />
              <ChartCard
                title="Tasks Completed"
                data={tasksCompletedData}
                color="#3d6b52"
              />
            </div>
          )}

          {/* ── Row 3: Table + New Leads chart ── */}
          {(upcomingTasks.length > 0 || newLeadsData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnalyticsTable tasks={taskRows} viewAllHref="/tasks" />
              <ChartCard
                title="New Leads"
                data={newLeadsData}
                color="#d3de2c"
              />
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
                        </div>{/* end overflow-x-auto */}
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
