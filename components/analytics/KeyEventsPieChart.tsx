"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { KeyEventSource } from "@/lib/actions/ga4";

interface Props {
  data: KeyEventSource[];
  keyEventName: string;
}

const COLORS = [
  "#263a2e",
  "#4a7c59",
  "#7aab8a",
  "#b0d4bc",
  "#d4e8db",
  "#8a6a2e",
  "#c49a4a",
  "#e4c87a",
  "#6a7c8a",
  "#a0b4c0",
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: KeyEventSource }[];
}) {
  if (!active || !payload?.length) return null;
  const { source, value } = payload[0].payload;
  return (
    <div className="bg-white border border-[#e2e0d9] rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-[#464540] mb-0.5 capitalize">{source}</p>
      <p className="font-semibold text-[#1a1a18] tabular-nums">
        {value.toLocaleString()} event{value !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

function CustomLegend({
  payload,
}: {
  payload?: { value: string; color: string }[];
}) {
  if (!payload?.length) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-1.5 text-xs text-[#464540]">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function KeyEventsPieChart({ data, keyEventName }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-[#8a8880]">
        No data for this event in the last 30 days.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e2e0d9] rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide mb-1">
          Lead Source
        </p>
        <p className="text-2xl font-heading font-semibold text-[#1a1a18] tabular-nums leading-none">
          {total.toLocaleString()}
          <span className="text-sm ml-1.5 font-normal text-[#8a8880] normal-case">
            {keyEventName.replace(/_/g, " ")} (30 days)
          </span>
        </p>
      </div>
      <div className="px-4 pb-5">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="source"
              cx="50%"
              cy="45%"
              outerRadius={80}
              innerRadius={44}
              paddingAngle={2}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
