"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createClientMetric,
  updateClientMetric,
  deleteClientMetric,
  addMetricDataPoint,
  updateMetricDataPoint,
  deleteMetricDataPoint,
} from "@/lib/actions/clientMetrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Trash2, ChevronDown, ChevronRight,
  Pencil, Check, X, BarChart2, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────

interface DataPoint {
  id: string;
  metricId: string;
  date: string; // ISO string
  value: number;
  notes: string | null;
}

interface Metric {
  id: string;
  clientId: string;
  name: string;
  color: string;
  showAsCard: boolean;
  showAsChart: boolean;
  sortOrder: number;
  dataPoints: DataPoint[];
}

interface MetricsManagerProps {
  clientId: string;
  metrics: Metric[];
}

// ── Colour presets ────────────────────────────────────────────

const COLORS = [
  "#263a2e", "#3d6b52", "#d3de2c", "#ff6b6c",
  "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4",
  "#ec4899", "#64748b",
];

function toInputDate(iso: string) {
  return new Date(iso).toISOString().split("T")[0];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ── Data table for one metric ─────────────────────────────────

function MetricDataTable({
  metric,
}: {
  metric: Metric;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVals, setEditVals] = useState({ date: "", value: "", notes: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({ date: "", value: "", notes: "" });
  const [rowError, setRowError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(dp: DataPoint) {
    setEditingId(dp.id);
    setEditVals({ date: toInputDate(dp.date), value: String(dp.value), notes: dp.notes ?? "" });
  }

  function saveEdit(dpId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("date", editVals.date);
      fd.append("value", editVals.value);
      fd.append("notes", editVals.notes);
      const res = await updateMetricDataPoint(dpId, null, fd);
      if (res?.error) setRowError(res.error);
      else { setEditingId(null); setRowError(null); }
    });
  }

  function handleAdd() {
    if (!newRow.date || !newRow.value) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("date", newRow.date);
      fd.append("value", newRow.value);
      fd.append("notes", newRow.notes);
      const res = await addMetricDataPoint(metric.id, null, fd);
      if (res?.error) setRowError(res.error);
      else { setNewRow({ date: "", value: "", notes: "" }); setIsAdding(false); setRowError(null); }
    });
  }

  function handleDelete(dpId: string) {
    startTransition(async () => { await deleteMetricDataPoint(dpId); });
  }

  const onKey = (e: React.KeyboardEvent, save: () => void, cancel: () => void) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  return (
    <div className="border border-[#e2e0d9] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        {/* Header */}
        <div className="grid grid-cols-[1fr_100px_1fr_72px] min-w-[420px] bg-[#f0efe9] px-4 py-2 border-b border-[#e2e0d9]">
          {["Date", "Value", "Notes", ""].map((h, i) => (
            <span key={i} className="text-xs font-semibold text-[#8a8880] uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#f0efe9] bg-white">
          {metric.dataPoints.length === 0 && !isAdding && (
            <p className="px-4 py-5 text-center text-sm text-[#8a8880]">
              No data yet — add a row below.
            </p>
          )}

          {metric.dataPoints
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((dp) =>
              editingId === dp.id ? (
                <div key={dp.id} className="grid grid-cols-[1fr_100px_1fr_72px] min-w-[420px] gap-2 px-4 py-2 items-center bg-[#faf9f6]">
                  <Input type="date" value={editVals.date}
                    onChange={(e) => setEditVals(v => ({ ...v, date: e.target.value }))}
                    onKeyDown={(e) => onKey(e, () => saveEdit(dp.id), () => setEditingId(null))}
                    className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" autoFocus />
                  <Input type="number" value={editVals.value}
                    onChange={(e) => setEditVals(v => ({ ...v, value: e.target.value }))}
                    onKeyDown={(e) => onKey(e, () => saveEdit(dp.id), () => setEditingId(null))}
                    className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
                  <Input value={editVals.notes} placeholder="Notes…"
                    onChange={(e) => setEditVals(v => ({ ...v, notes: e.target.value }))}
                    onKeyDown={(e) => onKey(e, () => saveEdit(dp.id), () => setEditingId(null))}
                    className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveEdit(dp.id)} disabled={isPending}>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5 text-[#8a8880]" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div key={dp.id} className="grid grid-cols-[1fr_100px_1fr_72px] min-w-[420px] gap-2 px-4 py-3 items-center hover:bg-[#faf9f6] group transition-colors">
                  <span className="text-sm text-[#464540] font-medium">{fmtDate(dp.date)}</span>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: metric.color }}>{dp.value.toLocaleString()}</span>
                  <span className="text-xs text-[#8a8880] truncate">{dp.notes ?? ""}</span>
                  <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(dp)}>
                      <Pencil className="h-3 w-3 text-[#8a8880]" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(dp.id)} disabled={isPending}>
                      <Trash2 className="h-3 w-3 text-[#ff6b6c]" />
                    </Button>
                  </div>
                </div>
              )
            )}

          {/* Add row */}
          {isAdding && (
            <div className="grid grid-cols-[1fr_100px_1fr_72px] min-w-[420px] gap-2 px-4 py-2 items-center bg-[#faf9f6]">
              <Input type="date" value={newRow.date}
                onChange={(e) => setNewRow(v => ({ ...v, date: e.target.value }))}
                onKeyDown={(e) => onKey(e, handleAdd, () => { setIsAdding(false); setNewRow({ date: "", value: "", notes: "" }); })}
                className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" autoFocus />
              <Input type="number" value={newRow.value} placeholder="0"
                onChange={(e) => setNewRow(v => ({ ...v, value: e.target.value }))}
                onKeyDown={(e) => onKey(e, handleAdd, () => { setIsAdding(false); setNewRow({ date: "", value: "", notes: "" }); })}
                className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
              <Input value={newRow.notes} placeholder="Notes…"
                onChange={(e) => setNewRow(v => ({ ...v, notes: e.target.value }))}
                onKeyDown={(e) => onKey(e, handleAdd, () => { setIsAdding(false); setNewRow({ date: "", value: "", notes: "" }); })}
                className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
              <div className="flex gap-1 justify-end">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleAdd}
                  disabled={isPending || !newRow.date || !newRow.value}>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8"
                  onClick={() => { setIsAdding(false); setNewRow({ date: "", value: "", notes: "" }); }}>
                  <X className="h-3.5 w-3.5 text-[#8a8880]" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[#e2e0d9] bg-[#faf9f6] flex items-center gap-3">
        {rowError && <p className="text-xs text-[#ff6b6c]">{rowError}</p>}
        {!isAdding && (
          <button onClick={() => setIsAdding(true)}
            className="text-xs text-[#8a8880] hover:text-[#464540] flex items-center gap-1 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </button>
        )}
      </div>
    </div>
  );
}

// ── Metric card (collapsible) ─────────────────────────────────

function MetricCard({
  metric,
  onDelete,
}: {
  metric: Metric;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(metric.dataPoints.length > 0);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(metric.name);
  const [selectedColor, setSelectedColor] = useState(metric.color);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function saveNameAndColor() {
    if (nameVal.trim() === metric.name && selectedColor === metric.color) {
      setEditingName(false);
      setShowColorPicker(false);
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", nameVal.trim() || metric.name);
      fd.append("color", selectedColor);
      fd.append("showAsCard", String(metric.showAsCard));
      fd.append("showAsChart", String(metric.showAsChart));
      await updateClientMetric(metric.id, null, fd);
      setEditingName(false);
      setShowColorPicker(false);
    });
  }

  function toggleDisplay(field: "showAsCard" | "showAsChart") {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", metric.name);
      fd.append("color", metric.color);
      fd.append("showAsCard", String(field === "showAsCard" ? !metric.showAsCard : metric.showAsCard));
      fd.append("showAsChart", String(field === "showAsChart" ? !metric.showAsChart : metric.showAsChart));
      await updateClientMetric(metric.id, null, fd);
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      await deleteClientMetric(metric.id);
      onDelete(metric.id);
    });
  }

  return (
    <div className="border border-[#e2e0d9] rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Color dot / picker trigger */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white ring-offset-1 hover:scale-110 transition-transform"
            style={{ backgroundColor: metric.color }}
            title="Change color"
          />
          {showColorPicker && (
            <div className="absolute left-0 top-6 z-10 bg-white border border-[#e2e0d9] rounded-xl p-3 shadow-lg">
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={cn(
                      "w-6 h-6 rounded-full hover:scale-110 transition-transform",
                      selectedColor === c && "ring-2 ring-offset-1 ring-[#263a2e]"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs bg-[#263a2e] text-[#ece9e1]"
                  onClick={saveNameAndColor} disabled={isPending}>
                  Apply
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs"
                  onClick={() => { setSelectedColor(metric.color); setShowColorPicker(false); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Name (editable inline) */}
        {editingName ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Input
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveNameAndColor();
                if (e.key === "Escape") { setNameVal(metric.name); setEditingName(false); }
              }}
              autoFocus
              className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0"
              onClick={saveNameAndColor} disabled={isPending}>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0"
              onClick={() => { setNameVal(metric.name); setEditingName(false); }}>
              <X className="h-3.5 w-3.5 text-[#8a8880]" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="flex-1 min-w-0 text-left text-sm font-semibold text-[#464540] hover:text-[#263a2e] transition-colors truncate"
          >
            {metric.name}
            <span className="ml-1.5 text-xs font-normal text-[#cad1cc]">
              {metric.dataPoints.length} point{metric.dataPoints.length !== 1 ? "s" : ""}
            </span>
          </button>
        )}

        {/* Display toggles */}
        {!editingName && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => toggleDisplay("showAsCard")}
              title={metric.showAsCard ? "Showing as stat card" : "Hidden from stat cards"}
              disabled={isPending}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                metric.showAsCard
                  ? "text-[#263a2e] bg-[#263a2e]/10"
                  : "text-[#cad1cc] hover:text-[#8a8880]"
              )}
            >
              <CreditCard className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => toggleDisplay("showAsChart")}
              title={metric.showAsChart ? "Showing as chart" : "Hidden from charts"}
              disabled={isPending}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                metric.showAsChart
                  ? "text-[#263a2e] bg-[#263a2e]/10"
                  : "text-[#cad1cc] hover:text-[#8a8880]"
              )}
            >
              <BarChart2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Delete */}
        {!editingName && !showDeleteConfirm && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-[#cad1cc] hover:text-[#ff6b6c] transition-colors flex-shrink-0 rounded-lg"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        {showDeleteConfirm && (
          <div className="flex items-center gap-2 flex-shrink-0 text-xs">
            <span className="text-[#8a8880]">Delete?</span>
            <button onClick={confirmDelete} disabled={isPending}
              className="text-[#ff6b6c] hover:underline">Yes</button>
            <button onClick={() => setShowDeleteConfirm(false)}
              className="text-[#8a8880] hover:underline">No</button>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 text-[#cad1cc] hover:text-[#8a8880] transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Data table */}
      {expanded && (
        <div className="border-t border-[#f0efe9]">
          <MetricDataTable metric={metric} />
        </div>
      )}
    </div>
  );
}

// ── Add metric form ───────────────────────────────────────────

function AddMetricForm({
  clientId,
  onClose,
  onSuccess,
}: {
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (!name.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("color", color);
      const res = await createClientMetric(clientId, null, fd);
      if (res?.error) setError(res.error);
      else { onSuccess(); onClose(); }
    });
  }

  return (
    <div className="border border-[#263a2e]/30 rounded-xl bg-[#263a2e]/[0.02] p-4 space-y-3">
      <p className="text-sm font-semibold text-[#464540]">New metric</p>
      <div className="flex items-center gap-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") onClose();
          }}
          placeholder="e.g. New Leads, Email Opens, Website Traffic…"
          autoFocus
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
      </div>
      <div>
        <p className="text-xs text-[#8a8880] mb-1.5">Color</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-6 h-6 rounded-full hover:scale-110 transition-transform",
                color === c && "ring-2 ring-offset-1 ring-[#263a2e]"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      {error && <p className="text-xs text-[#ff6b6c]">{error}</p>}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleAdd}
          disabled={isPending || !name.trim()}
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-sm h-8"
        >
          {isPending ? "Adding…" : "Add Metric"}
        </Button>
        <Button variant="ghost" size="sm" className="text-sm h-8" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export function MetricsManager({ clientId, metrics: initialMetrics }: MetricsManagerProps) {
  const router = useRouter();
  const [metrics, setMetrics] = useState(initialMetrics);
  const [showAddForm, setShowAddForm] = useState(false);

  // Sync when Next.js re-renders the server component with fresh data
  useEffect(() => {
    setMetrics(initialMetrics);
  }, [initialMetrics]);

  function handleDelete(id: string) {
    setMetrics((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-3">
      {metrics.length === 0 && !showAddForm && (
        <p className="text-sm text-[#8a8880] py-2">
          No metrics yet. Add your first metric to start tracking data.
        </p>
      )}

      {metrics
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((metric) => (
          <MetricCard key={metric.id} metric={metric} onDelete={handleDelete} />
        ))}

      {showAddForm ? (
        <AddMetricForm
          clientId={clientId}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => router.refresh()}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#8a8880] hover:text-[#464540] border border-dashed border-[#e2e0d9] rounded-xl w-full hover:border-[#263a2e]/40 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Metric
        </button>
      )}

      {metrics.length > 0 && (
        <p className="text-xs text-[#8a8880] pt-1">
          Click a metric name to rename it.
          <span className="inline-flex items-center gap-1 mx-1">
            <span className="inline-block w-3.5 h-3.5 align-middle"><CreditCard className="h-3.5 w-3.5 inline" /></span>
          </span>
          = stat card,
          <span className="inline-flex items-center gap-1 mx-1">
            <span className="inline-block w-3.5 h-3.5 align-middle"><BarChart2 className="h-3.5 w-3.5 inline" /></span>
          </span>
          = chart. Filled = visible on client dashboard.
        </p>
      )}
    </div>
  );
}
