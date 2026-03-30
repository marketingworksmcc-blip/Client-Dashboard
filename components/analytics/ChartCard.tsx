"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Range = "7D" | "1M" | "6M" | "1Y";

interface DataPoint {
  date: string; // ISO string
  value: number;
}

interface ChartCardProps {
  title: string;
  data: DataPoint[];
  color?: string;
  valueLabel?: string;
}

const RANGES: Range[] = ["7D", "1M", "6M", "1Y"];

const RANGE_DAYS: Record<Range, number> = {
  "7D": 7,
  "1M": 30,
  "6M": 180,
  "1Y": 365,
};

function formatLabel(isoDate: string, range: Range): string {
  const d = new Date(isoDate);
  if (range === "7D") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "1M") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "6M") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e2e0d9] rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="text-[#8a8880] mb-0.5">{label}</p>
      <p className="font-semibold text-[#1a1a18] tabular-nums">{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export function ChartCard({ title, data, color = "#263a2e", valueLabel }: ChartCardProps) {
  const [range, setRange] = useState<Range>("1M");

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS[range]);

    return data
      .filter((d) => new Date(d.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((d) => ({
        label: formatLabel(d.date, range),
        value: d.value,
      }));
  }, [data, range]);

  const total = useMemo(() => filtered.reduce((s, d) => s + d.value, 0), [filtered]);

  return (
    <div className="bg-white border border-[#e2e0d9] rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div>
          <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-heading font-semibold text-[#1a1a18] tabular-nums leading-none">
            {total.toLocaleString()}
            {valueLabel && <span className="text-sm ml-1 font-normal text-[#8a8880]">{valueLabel}</span>}
          </p>
        </div>
        {/* Range toggle */}
        <div className="flex items-center gap-0.5 bg-[#f0efe9] rounded-lg p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                range === r
                  ? "bg-white text-[#1a1a18] shadow-sm"
                  : "text-[#8a8880] hover:text-[#464540]"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 text-[#8a8880]">
            <BarChart2 className="h-7 w-7 mb-2 opacity-30" />
            <p className="text-xs">No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={filtered} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0efe9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#8a8880" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#8a8880" }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
