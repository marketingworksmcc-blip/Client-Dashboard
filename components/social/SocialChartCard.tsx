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

type Mode = "Daily" | "Cumulative";

interface DataPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

interface SocialChartCardProps {
  title: string;
  data: DataPoint[];
  color?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e2e0d9] rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="text-[#8a8880] mb-0.5">{label}</p>
      <p className="font-semibold text-[#1a1a18] tabular-nums">{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export function SocialChartCard({ title, data, color = "#263a2e" }: SocialChartCardProps) {
  const [mode, setMode] = useState<Mode>("Daily");

  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

    if (mode === "Cumulative") {
      let running = 0;
      return sorted.map((d) => {
        running += d.value;
        return { label: formatDate(d.date), value: running };
      });
    }

    return sorted.map((d) => ({ label: formatDate(d.date), value: d.value }));
  }, [data, mode]);

  const displayTotal = useMemo(
    () => data.reduce((s, d) => s + d.value, 0),
    [data]
  );

  return (
    <div className="bg-white border border-[#e2e0d9] rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div>
          <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-heading font-semibold text-[#1a1a18] tabular-nums leading-none">
            {displayTotal.toLocaleString()}
          </p>
        </div>
        {/* Daily / Cumulative toggle */}
        <div className="flex items-center gap-0.5 bg-[#f0efe9] rounded-lg p-0.5">
          {(["Daily", "Cumulative"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                mode === m
                  ? "bg-white text-[#1a1a18] shadow-sm"
                  : "text-[#8a8880] hover:text-[#464540]"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2 pb-4">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 text-[#8a8880]">
            <BarChart2 className="h-7 w-7 mb-2 opacity-30" />
            <p className="text-xs">No data yet — sync to populate</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
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
