"use client";

import { useState, useTransition } from "react";
import { addMetric, updateMetric, deleteMetric } from "@/lib/actions/analytics";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Metric {
  id: string;
  metricName: string;
  metricValue: string;
  notes: string | null;
}

interface ScorecardTableProps {
  reportId: string;
  metrics: Metric[];
}

const EMPTY_ROW = { metricName: "", metricValue: "", notes: "" };

export function ScorecardTable({ reportId, metrics }: ScorecardTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState(EMPTY_ROW);
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(m: Metric) {
    setEditingId(m.id);
    setEditValues({ metricName: m.metricName, metricValue: m.metricValue, notes: m.notes ?? "" });
  }

  function handleSaveEdit(metricId: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("metricName", editValues.metricName);
      fd.append("metricValue", editValues.metricValue);
      fd.append("notes", editValues.notes);
      const result = await updateMetric(metricId, null, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditingId(null);
        setError(null);
      }
    });
  }

  function handleDelete(metricId: string) {
    startTransition(async () => {
      await deleteMetric(metricId);
    });
  }

  function handleAddRow() {
    if (!newRow.metricName.trim() || !newRow.metricValue.trim()) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("metricName", newRow.metricName);
      fd.append("metricValue", newRow.metricValue);
      fd.append("notes", newRow.notes);
      const result = await addMetric(reportId, null, fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setNewRow(EMPTY_ROW);
        setIsAdding(false);
        setError(null);
      }
    });
  }

  function handleNewRowKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAddRow();
    if (e.key === "Escape") { setIsAdding(false); setNewRow(EMPTY_ROW); }
  }

  function handleEditKeyDown(e: React.KeyboardEvent, metricId: string) {
    if (e.key === "Enter") handleSaveEdit(metricId);
    if (e.key === "Escape") setEditingId(null);
  }

  return (
    <div className="border border-[#e2e0d9] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
      {/* Header row */}
      <div className="grid grid-cols-[2fr_1fr_2fr_72px] min-w-[480px] bg-[#f0efe9] px-4 py-2.5 border-b border-[#e2e0d9]">
        <span className="text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Metric</span>
        <span className="text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Value</span>
        <span className="text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Notes</span>
        <span />
      </div>

      {/* Data rows */}
      <div className="divide-y divide-[#f0efe9] bg-white">
        {metrics.length === 0 && !isAdding && (
          <p className="px-4 py-6 text-center text-sm text-[#8a8880]">
            No metrics yet — click "Add Row" below to get started.
          </p>
        )}

        {metrics.map((m) =>
          editingId === m.id ? (
            <div key={m.id} className="grid grid-cols-[2fr_1fr_2fr_72px] min-w-[480px] gap-2 px-4 py-2 items-center bg-[#faf9f6]">
              <Input
                value={editValues.metricName}
                onChange={(e) => setEditValues((v) => ({ ...v, metricName: e.target.value }))}
                onKeyDown={(e) => handleEditKeyDown(e, m.id)}
                autoFocus
                className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
              />
              <Input
                value={editValues.metricValue}
                onChange={(e) => setEditValues((v) => ({ ...v, metricValue: e.target.value }))}
                onKeyDown={(e) => handleEditKeyDown(e, m.id)}
                className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
              />
              <Input
                value={editValues.notes}
                onChange={(e) => setEditValues((v) => ({ ...v, notes: e.target.value }))}
                onKeyDown={(e) => handleEditKeyDown(e, m.id)}
                placeholder="Notes…"
                className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
              />
              <div className="flex gap-1 justify-end">
                <Button
                  size="icon" variant="ghost" className="h-8 w-8"
                  onClick={() => handleSaveEdit(m.id)}
                  disabled={isPending}
                >
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                </Button>
                <Button
                  size="icon" variant="ghost" className="h-8 w-8"
                  onClick={() => setEditingId(null)}
                >
                  <X className="h-3.5 w-3.5 text-[#8a8880]" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              key={m.id}
              className="grid grid-cols-[2fr_1fr_2fr_72px] min-w-[480px] gap-2 px-4 py-3 items-center hover:bg-[#faf9f6] group transition-colors"
            >
              <span className="text-sm text-[#464540] font-medium">{m.metricName}</span>
              <span className="text-sm font-semibold text-[#263a2e] tabular-nums">{m.metricValue}</span>
              <span className="text-xs text-[#8a8880] truncate">{m.notes ?? ""}</span>
              <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon" variant="ghost" className="h-7 w-7"
                  onClick={() => startEdit(m)}
                >
                  <Pencil className="h-3 w-3 text-[#8a8880]" />
                </Button>
                <Button
                  size="icon" variant="ghost" className="h-7 w-7"
                  onClick={() => handleDelete(m.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3 w-3 text-[#ff6b6c]" />
                </Button>
              </div>
            </div>
          )
        )}

        {/* New row input */}
        {isAdding && (
          <div className="grid grid-cols-[2fr_1fr_2fr_72px] min-w-[480px] gap-2 px-4 py-2 items-center bg-[#faf9f6]">
            <Input
              value={newRow.metricName}
              onChange={(e) => setNewRow((v) => ({ ...v, metricName: e.target.value }))}
              onKeyDown={handleNewRowKeyDown}
              placeholder="e.g. Impressions"
              autoFocus
              className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
            />
            <Input
              value={newRow.metricValue}
              onChange={(e) => setNewRow((v) => ({ ...v, metricValue: e.target.value }))}
              onKeyDown={handleNewRowKeyDown}
              placeholder="e.g. 42,300"
              className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
            />
            <Input
              value={newRow.notes}
              onChange={(e) => setNewRow((v) => ({ ...v, notes: e.target.value }))}
              onKeyDown={handleNewRowKeyDown}
              placeholder="Context or period…"
              className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
            />
            <div className="flex gap-1 justify-end">
              <Button
                size="icon" variant="ghost" className="h-8 w-8"
                onClick={handleAddRow}
                disabled={isPending || !newRow.metricName.trim() || !newRow.metricValue.trim()}
              >
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              </Button>
              <Button
                size="icon" variant="ghost" className="h-8 w-8"
                onClick={() => { setIsAdding(false); setNewRow(EMPTY_ROW); }}
              >
                <X className="h-3.5 w-3.5 text-[#8a8880]" />
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>{/* end overflow-x-auto */}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[#e2e0d9] bg-[#faf9f6] flex items-center gap-3">
        {error && <p className="text-xs text-[#ff6b6c]">{error}</p>}
        {!isAdding && (
          <Button
            variant="ghost" size="sm"
            onClick={() => setIsAdding(true)}
            className="text-[#8a8880] hover:text-[#464540] text-xs h-7 px-2 gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </Button>
        )}
      </div>
    </div>
  );
}
