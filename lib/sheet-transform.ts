/**
 * Transforms raw Google Sheets rows into AnalyticsDataPoint records.
 *
 * Expected header row (case-insensitive, order flexible):
 *   Date | New Leads | Tasks Created | Tasks Completed | Hours Worked | Clients Onboarded
 *
 * Extra columns are silently ignored.
 * Rows with an unparseable date or no recognised metric columns are skipped.
 */

import type { MetricType } from "@prisma/client";

/** Maps normalised column header text → MetricType enum value. */
const COLUMN_MAP: Record<string, MetricType> = {
  "new leads":          "NEW_LEADS",
  "new lead":           "NEW_LEADS",
  leads:                "NEW_LEADS",
  "tasks created":      "TASKS_CREATED",
  "tasks completed":    "TASKS_COMPLETED",
  "hours worked":       "AVG_HOURS",
  "avg hours":          "AVG_HOURS",
  "average hours":      "AVG_HOURS",
  hours:                "AVG_HOURS",
  "clients onboarded":  "CLIENTS_ONBOARDED",
  onboarded:            "CLIENTS_ONBOARDED",
  "total clients":      "TOTAL_CLIENTS",
  clients:              "TOTAL_CLIENTS",
};

export interface TransformedDataPoint {
  metricType: MetricType;
  date: Date;
  value: number;
}

/**
 * Parse the 2-D array returned by fetchSheetRows into structured data points.
 * Returns an empty array when the sheet has no usable rows.
 */
export function transformSheetRows(rows: string[][]): TransformedDataPoint[] {
  if (rows.length < 2) return [];

  // ── 1. Parse headers ────────────────────────────────────────
  const headers = rows[0].map((h) =>
    String(h ?? "")
      .trim()
      .toLowerCase()
  );

  const dateColIdx = headers.findIndex((h) => h === "date");
  if (dateColIdx === -1) return []; // No date column — can't proceed.

  // Map column index → MetricType for every recognised header.
  const metricCols: Array<{ idx: number; metricType: MetricType }> = [];
  headers.forEach((h, i) => {
    if (i === dateColIdx) return;
    const mt = COLUMN_MAP[h];
    if (mt) metricCols.push({ idx: i, metricType: mt });
  });

  if (metricCols.length === 0) return []; // No metric columns found.

  // ── 2. Parse data rows ──────────────────────────────────────
  const results: TransformedDataPoint[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rawDate = String(row[dateColIdx] ?? "").trim();
    if (!rawDate) continue;

    const date = parseDate(rawDate);
    if (!date) continue;

    for (const { idx, metricType } of metricCols) {
      const raw = String(row[idx] ?? "")
        .replace(/,/g, "")   // remove thousands separators
        .replace(/%/g, "")   // strip percent signs
        .trim();

      if (!raw) continue;

      const value = parseFloat(raw);
      if (isNaN(value)) continue;

      results.push({ metricType, date, value });
    }
  }

  return results;
}

/** Try several common date formats. Returns null if unparseable. */
function parseDate(raw: string): Date | null {
  // ISO format: 2024-01-15
  let d = new Date(raw);
  if (!isNaN(d.getTime())) return d;

  // MM/DD/YYYY
  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    d = new Date(`${mdy[3]}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`);
    if (!isNaN(d.getTime())) return d;
  }

  // DD/MM/YYYY
  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    d = new Date(`${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`);
    if (!isNaN(d.getTime())) return d;
  }

  // "Jan 15, 2024" or "January 15 2024"
  d = new Date(raw.replace(/(\d+)(st|nd|rd|th)/i, "$1"));
  if (!isNaN(d.getTime())) return d;

  return null;
}
