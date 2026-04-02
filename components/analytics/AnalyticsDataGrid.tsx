"use client";

import { useState, useRef, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  type ColDef,
} from "ag-grid-community";
import { saveGridRows, deleteGridRows } from "@/lib/actions/analyticsGrid";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, Download, Upload, BarChart2 } from "lucide-react";

ModuleRegistry.registerModules([AllCommunityModule]);

// ── Custom theme ───────────────────────────────────────────────
const gridTheme = themeQuartz.withParams({
  accentColor: "#263a2e",
  headerBackgroundColor: "#f0efe9",
  headerTextColor: "#8a8880",
  headerFontSize: 11,
  headerFontWeight: 600,
  fontFamily: "inherit",
  fontSize: 13,
  rowHeight: 36,
  headerHeight: 36,
  cellHorizontalPaddingScale: 0.8,
  borderColor: "#e2e0d9",
  oddRowBackgroundColor: "#faf9f6",
});

// ── Public types (used by page.tsx) ───────────────────────────
export interface GridMetric {
  id: string;
  name: string;
  color: string;
}

export interface GridRow {
  rowId: string;
  id: string | null;
  metricId: string;
  date: string;
  value: number;
  notes: string;
  _dirty: boolean;
  _isNew: boolean;
}

// ── Internal pivot row: one row per date, one column per metric ─
interface PivotRow {
  rowId: string; // date string "YYYY-MM-DD"
  date: string;
  _dirty: boolean;
  _isNew: boolean;
  [metricId: string]: unknown; // metric values
}

// date → metricId → dataPointId (for upserts)
type DpIndex = Record<string, Record<string, string>>;

function flatToPivot(
  rows: GridRow[],
  metrics: GridMetric[]
): { pivotRows: PivotRow[]; dpIndex: DpIndex } {
  const map: Record<string, PivotRow> = {};
  const dpIndex: DpIndex = {};

  for (const row of rows) {
    if (!map[row.date]) {
      const pr: PivotRow = { rowId: row.date, date: row.date, _dirty: false, _isNew: false };
      for (const m of metrics) pr[m.id] = null;
      map[row.date] = pr;
      dpIndex[row.date] = {};
    }
    map[row.date][row.metricId] = row.value;
    if (row.id) dpIndex[row.date][row.metricId] = row.id;
  }

  return { pivotRows: Object.values(map), dpIndex };
}

// ── Props ──────────────────────────────────────────────────────
interface AnalyticsDataGridProps {
  clientId: string;
  metrics: GridMetric[];
  initialRows: GridRow[];
}

// ── Component ──────────────────────────────────────────────────
export function AnalyticsDataGrid({ clientId, metrics, initialRows }: AnalyticsDataGridProps) {
  const router = useRouter();
  const gridRef = useRef<AgGridReact<PivotRow>>(null);
  const dpIndexRef = useRef<DpIndex>({});

  const [rowData, setRowData] = useState<PivotRow[]>(() => {
    const { pivotRows, dpIndex } = flatToPivot(initialRows, metrics);
    dpIndexRef.current = dpIndex;
    return pivotRows;
  });

  const [selectedRows, setSelectedRows] = useState<PivotRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with fresh server data after save/refresh
  useEffect(() => {
    const { pivotRows, dpIndex } = flatToPivot(initialRows, metrics);
    dpIndexRef.current = dpIndex;
    setRowData(pivotRows);
  }, [initialRows]);

  const dirtyCount = rowData.filter((r) => r._dirty).length;

  // ── Column definitions ─────────────────────────────────────
  const colDefs: ColDef<PivotRow>[] = [
    {
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 44,
      pinned: "left",
      resizable: false,
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
    },
    {
      field: "_dirty" as keyof PivotRow,
      headerName: "",
      width: 24,
      resizable: false,
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      cellRenderer: (p: { value: unknown }) =>
        p.value
          ? `<span title="Unsaved" style="color:#f59e0b;font-size:8px;line-height:36px;display:block;text-align:center;">●</span>`
          : "",
    },
    {
      field: "date" as keyof PivotRow,
      headerName: "Date",
      editable: true,
      cellEditor: "agDateStringCellEditor",
      width: 140,
      sort: "desc",
      sortable: true,
      filter: "agDateColumnFilter",
      filterParams: { browserDatePicker: true },
      pinned: "left",
    },
    // One column per metric
    ...metrics.map((m): ColDef<PivotRow> => ({
      field: m.id as keyof PivotRow,
      headerName: m.name,
      editable: true,
      cellEditor: "agNumberCellEditor",
      cellEditorParams: { precision: 2 },
      type: "numericColumn",
      minWidth: 120,
      flex: 1,
      sortable: true,
      filter: "agNumberColumnFilter",
      valueParser: (p) =>
        p.newValue === "" || p.newValue == null ? null : Number(p.newValue),
      valueFormatter: (p) =>
        p.value != null ? Number(p.value).toLocaleString() : "",
    })),
  ];

  // ── Row styling ─────────────────────────────────────────────
  const getRowStyle = useCallback((params: { data?: PivotRow }) => {
    if (!params.data) return {};
    if (params.data._isNew) return { backgroundColor: "#f0fdf4" };
    if (params.data._dirty) return { backgroundColor: "#fffbeb" };
    return {};
  }, []);

  // ── Handlers ───────────────────────────────────────────────
  function onCellValueChanged(e: { data: PivotRow }) {
    setRowData((prev) =>
      prev.map((row) =>
        row.rowId === e.data.rowId ? { ...row, ...e.data, _dirty: true } : row
      )
    );
  }

  function onSelectionChanged() {
    const sel = gridRef.current?.api.getSelectedRows() ?? [];
    setSelectedRows(sel);
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function handleAddRow() {
    const today = new Date().toISOString().split("T")[0];
    if (rowData.find((r) => r.date === today)) {
      showMessage("error", "A row for today already exists.");
      return;
    }
    const pr: PivotRow = { rowId: today, date: today, _dirty: true, _isNew: true };
    for (const m of metrics) pr[m.id] = null;
    setRowData((prev) => [...prev, pr]);
  }

  function handleDeleteSelected() {
    if (selectedRows.length === 0) return;
    const idsToDelete: string[] = selectedRows.flatMap((row) =>
      Object.values(dpIndexRef.current[row.date] ?? {})
    );
    const rowIdsToRemove = new Set(selectedRows.map((r) => r.rowId));
    setRowData((prev) => prev.filter((r) => !rowIdsToRemove.has(r.rowId)));
    setSelectedRows([]);
    if (idsToDelete.length > 0) {
      startTransition(async () => {
        await deleteGridRows(clientId, idsToDelete);
      });
    }
  }

  function handleSave() {
    const dirty = rowData.filter((r) => r._dirty);
    if (dirty.length === 0) return;

    const rowsToSave = dirty.flatMap((row) =>
      metrics
        .filter((m) => row[m.id] !== null && row[m.id] !== undefined && !isNaN(Number(row[m.id])))
        .map((m) => ({
          id: dpIndexRef.current[row.date]?.[m.id] ?? null,
          metricId: m.id,
          date: row.date,
          value: Number(row[m.id]),
          notes: "",
        }))
    );

    if (rowsToSave.length === 0) {
      showMessage("error", "No values to save. Fill in at least one cell.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveGridRows(clientId, rowsToSave);
        if (result.success) {
          showMessage(
            "success",
            `Saved ${result.saved} data point${result.saved !== 1 ? "s" : ""}`
          );
          router.refresh();
        }
      } catch {
        showMessage("error", "Save failed. Please try again.");
      }
    });
  }

  function handleExportCSV() {
    const headers = ["Date", ...metrics.map((m) => m.name)];
    const rows = rowData
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((row) => [
        row.date,
        ...metrics.map((m) => (row[m.id] != null ? String(row[m.id]) : "")),
      ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${clientId}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => parseAndImportCSV(ev.target?.result as string);
    reader.readAsText(file);
    e.target.value = "";
  }

  function parseAndImportCSV(text: string) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) { showMessage("error", "CSV file is empty."); return; }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    if (headers[0].toLowerCase() !== "date") {
      showMessage("error", "CSV must start with a Date column.");
      return;
    }

    const metricNameToId = Object.fromEntries(metrics.map((m) => [m.name.toLowerCase(), m.id]));
    const colMetricIds: (string | null)[] = headers
      .slice(1)
      .map((h) => metricNameToId[h.toLowerCase()] ?? null);

    if (colMetricIds.every((m) => m === null)) {
      showMessage("error", "No matching metric columns found. Column headers must match metric names exactly.");
      return;
    }

    const newRows: PivotRow[] = [];
    const skipped: number[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const date = cols[0];
      if (!date) { skipped.push(i + 1); continue; }

      const existing = rowData.find((r) => r.date === date);
      const pr: PivotRow = existing
        ? { ...existing, _dirty: true }
        : { rowId: date, date, _dirty: true, _isNew: !dpIndexRef.current[date], ...Object.fromEntries(metrics.map((m) => [m.id, null])) };

      let hasValue = false;
      colMetricIds.forEach((metricId, ci) => {
        if (!metricId) return;
        const val = parseFloat(cols[ci + 1]);
        if (!isNaN(val)) { pr[metricId] = val; hasValue = true; }
      });

      if (!hasValue) { skipped.push(i + 1); continue; }
      newRows.push(pr);
    }

    if (newRows.length === 0) {
      showMessage("error", "No valid rows found. Check that column headers match metric names.");
      return;
    }

    setRowData((prev) => {
      const map = Object.fromEntries(prev.map((r) => [r.date, r]));
      for (const r of newRows) map[r.date] = r;
      return Object.values(map);
    });

    showMessage(
      "success",
      `Imported ${newRows.length} row${newRows.length !== 1 ? "s" : ""}${
        skipped.length > 0 ? ` (${skipped.length} skipped)` : ""
      }. Review and save.`
    );
  }

  // ── Empty state ────────────────────────────────────────────
  if (metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#e2e0d9] rounded-xl bg-[#faf9f6]">
        <BarChart2 className="h-8 w-8 text-[#e2e0d9] mb-3" />
        <p className="text-sm font-medium text-[#464540] mb-1">No metrics defined</p>
        <p className="text-xs text-[#8a8880]">
          Switch to Dashboard view to add metrics before entering data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={handleAddRow}
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] h-8 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Row
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleDeleteSelected}
          disabled={selectedRows.length === 0}
          className="border-[#ff6b6c]/30 text-[#ff6b6c] hover:bg-[#ff6b6c]/5 h-8 text-xs"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Delete{selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
        </Button>

        <div className="flex-1" />

        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="border-[#e2e0d9] h-8 text-xs text-[#464540]"
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          Import CSV
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCSV}
          className="border-[#e2e0d9] h-8 text-xs text-[#464540]"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Export CSV
        </Button>

        <Button
          size="sm"
          onClick={handleSave}
          disabled={dirtyCount === 0 || isPending}
          className="bg-[#d3de2c] hover:bg-[#c4cf20] text-[#263a2e] h-8 text-xs font-semibold disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          {isPending ? "Saving…" : `Save${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
        </Button>
      </div>

      {/* ── Status message ── */}
      {message && (
        <div
          className={`px-3 py-2 rounded-lg text-xs font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-[#ff6b6c] border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ── Grid ── */}
      <div style={{ height: 500 }} className="rounded-xl overflow-hidden border border-[#e2e0d9]">
        <AgGridReact<PivotRow>
          ref={gridRef}
          theme={gridTheme}
          rowData={rowData}
          columnDefs={colDefs}
          getRowId={(p) => p.data.rowId}
          rowSelection={{ mode: "multiRow", checkboxes: true, headerCheckbox: true }}
          onSelectionChanged={onSelectionChanged}
          onCellValueChanged={onCellValueChanged}
          getRowStyle={getRowStyle}
          stopEditingWhenCellsLoseFocus
          suppressRowClickSelection
          animateRows={false}
          defaultColDef={{
            resizable: true,
            suppressHeaderMenuButton: false,
          }}
          noRowsOverlayComponent={() => (
            <div className="text-sm text-[#8a8880] py-4">
              No data yet — click <strong>Add Row</strong> or <strong>Import CSV</strong> to get started.
            </div>
          )}
        />
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between text-xs text-[#8a8880] px-0.5">
        <span>
          {rowData.length} row{rowData.length !== 1 ? "s" : ""}
          {selectedRows.length > 0 && (
            <span className="ml-2 text-[#464540]">· {selectedRows.length} selected</span>
          )}
        </span>
        {dirtyCount > 0 && (
          <span className="text-amber-600 font-medium">
            {dirtyCount} unsaved change{dirtyCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── CSV hint ── */}
      <p className="text-xs text-[#cad1cc]">
        CSV format:{" "}
        <span className="font-mono">Date, {metrics.map((m) => m.name).join(", ")}</span>
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
