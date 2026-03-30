"use client";

import { useState, useTransition } from "react";
import { createDataPoint, updateDataPoint, deleteDataPoint } from "@/lib/actions/analyticsData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

type MetricType =
  | "CLIENTS_ONBOARDED"
  | "TOTAL_CLIENTS"
  | "NEW_LEADS"
  | "TASKS_CREATED"
  | "TASKS_COMPLETED"
  | "AVG_HOURS";

interface DataPoint {
  id: string;
  metricType: MetricType;
  date: Date | string;
  value: number;
  notes: string | null;
}

interface DataPointsManagerProps {
  clientId: string;
  dataPoints: DataPoint[];
}

const METRIC_OPTIONS: { value: MetricType; label: string }[] = [
  { value: "CLIENTS_ONBOARDED", label: "Clients Onboarded" },
  { value: "TOTAL_CLIENTS", label: "Total Clients" },
  { value: "NEW_LEADS", label: "New Leads" },
  { value: "TASKS_CREATED", label: "Tasks Created" },
  { value: "TASKS_COMPLETED", label: "Tasks Completed" },
  { value: "AVG_HOURS", label: "Avg Working Hours" },
];

const EMPTY_ROW = { date: "", value: "", notes: "" };

function toInputDate(d: Date | string): string {
  return new Date(d).toISOString().split("T")[0];
}

function formatDisplayDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DataPointsManager({ clientId, dataPoints }: DataPointsManagerProps) {
  const [activeMetric, setActiveMetric] = useState<MetricType>("CLIENTS_ONBOARDED");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState(EMPTY_ROW);
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = dataPoints
    .filter((d) => d.metricType === activeMetric)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function startEdit(dp: DataPoint) {
    setEditingId(dp.id);
    setEditValues({ date: toInputDate(dp.date), value: String(dp.value), notes: dp.notes ?? "" });
  }

  function handleSaveEdit(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("metricType", activeMetric);
      fd.append("date", editValues.date);
      fd.append("value", editValues.value);
      fd.append("notes", editValues.notes);
      const result = await updateDataPoint(id, null, fd);
      if (result?.error) { setError(result.error); } else { setEditingId(null); setError(null); }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteDataPoint(id); });
  }

  function handleAddRow() {
    if (!newRow.date || !newRow.value) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("metricType", activeMetric);
      fd.append("date", newRow.date);
      fd.append("value", newRow.value);
      fd.append("notes", newRow.notes);
      const result = await createDataPoint(clientId, null, fd);
      if (result?.error) { setError(result.error); } else { setNewRow(EMPTY_ROW); setIsAdding(false); setError(null); }
    });
  }

  return (
    <div className="space-y-4">
      {/* Metric type tabs */}
      <div className="flex flex-wrap gap-1.5">
        {METRIC_OPTIONS.map((m) => {
          const count = dataPoints.filter((d) => d.metricType === m.value).length;
          return (
            <button
              key={m.value}
              onClick={() => { setActiveMetric(m.value); setIsAdding(false); setEditingId(null); setError(null); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                activeMetric === m.value
                  ? "bg-[#263a2e] text-[#ece9e1] border-[#263a2e]"
                  : "bg-white text-[#8a8880] border-[#e2e0d9] hover:border-[#263a2e] hover:text-[#263a2e]"
              }`}
            >
              {m.label}
              {count > 0 && (
                <span className={`ml-1.5 text-[10px] ${activeMetric === m.value ? "opacity-70" : "text-[#8a8880]"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="border border-[#e2e0d9] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
        <div className="grid grid-cols-[1fr_80px_1fr_72px] min-w-[440px] bg-[#f0efe9] px-4 py-2.5 border-b border-[#e2e0d9]">
          <span className="text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Date</span>
          <span className="text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Value</span>
          <span className="text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Notes</span>
          <span />
        </div>

        <div className="divide-y divide-[#f0efe9] bg-white">
          {filtered.length === 0 && !isAdding && (
            <p className="px-4 py-5 text-center text-sm text-[#8a8880]">
              No data yet — add a row below.
            </p>
          )}

          {filtered.map((dp) =>
            editingId === dp.id ? (
              <div key={dp.id} className="grid grid-cols-[1fr_80px_1fr_72px] min-w-[440px] gap-2 px-4 py-2 items-center bg-[#faf9f6]">
                <Input
                  type="date"
                  value={editValues.date}
                  onChange={(e) => setEditValues((v) => ({ ...v, date: e.target.value }))}
                  className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
                />
                <Input
                  type="number"
                  value={editValues.value}
                  onChange={(e) => setEditValues((v) => ({ ...v, value: e.target.value }))}
                  className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
                />
                <Input
                  value={editValues.notes}
                  onChange={(e) => setEditValues((v) => ({ ...v, notes: e.target.value }))}
                  placeholder="Notes…"
                  className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
                />
                <div className="flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveEdit(dp.id)} disabled={isPending}>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5 text-[#8a8880]" />
                  </Button>
                </div>
              </div>
            ) : (
              <div key={dp.id} className="grid grid-cols-[1fr_80px_1fr_72px] min-w-[440px] gap-2 px-4 py-3 items-center hover:bg-[#faf9f6] group transition-colors">
                <span className="text-sm text-[#464540] font-medium">{formatDisplayDate(dp.date)}</span>
                <span className="text-sm font-semibold text-[#263a2e] tabular-nums">{dp.value.toLocaleString()}</span>
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

          {isAdding && (
            <div className="grid grid-cols-[1fr_80px_1fr_72px] min-w-[440px] gap-2 px-4 py-2 items-center bg-[#faf9f6]">
              <Input
                type="date"
                value={newRow.date}
                onChange={(e) => setNewRow((v) => ({ ...v, date: e.target.value }))}
                autoFocus
                className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
              />
              <Input
                type="number"
                value={newRow.value}
                onChange={(e) => setNewRow((v) => ({ ...v, value: e.target.value }))}
                placeholder="0"
                className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
              />
              <Input
                value={newRow.notes}
                onChange={(e) => setNewRow((v) => ({ ...v, notes: e.target.value }))}
                placeholder="Notes…"
                className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
              />
              <div className="flex gap-1 justify-end">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleAddRow}
                  disabled={isPending || !newRow.date || !newRow.value}>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setIsAdding(false); setNewRow(EMPTY_ROW); }}>
                  <X className="h-3.5 w-3.5 text-[#8a8880]" />
                </Button>
              </div>
            </div>
          )}
        </div>
        </div>{/* end overflow-x-auto */}

        <div className="px-4 py-2.5 border-t border-[#e2e0d9] bg-[#faf9f6] flex items-center gap-3">
          {error && <p className="text-xs text-[#ff6b6c]">{error}</p>}
          {!isAdding && (
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}
              className="text-[#8a8880] hover:text-[#464540] text-xs h-7 px-2 gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add Row
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
