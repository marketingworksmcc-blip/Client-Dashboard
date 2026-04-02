"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { FunnelChannelDataPoint } from "@/lib/actions/funnel";

interface Props {
  data: FunnelChannelDataPoint[];
}

const COLORS = [
  "#263a2e",
  "#3d6b52",
  "#5a9e78",
  "#7ec99d",
  "#a8dbbe",
  "#d4efdf",
  "#1a2e23",
  "#4a8060",
  "#6db88a",
  "#94ccac",
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: FunnelChannelDataPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const { channel, value } = payload[0].payload;
  return (
    <div className="bg-white border border-[#e2e0d9] rounded-lg px-3 py-2 shadow-md text-xs max-w-[200px]">
      <p className="font-medium text-[#464540] mb-0.5 truncate">{channel}</p>
      <p className="font-semibold text-[#1a1a18] tabular-nums">${value.toFixed(2)} spend</p>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: { value: string; color: string }[] }) {
  if (!payload?.length) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-1.5 text-xs text-[#464540] max-w-[160px]">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="truncate">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function FunnelChannelPieChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-[#8a8880]">
        No channel data in the last 30 days.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e2e0d9] rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide mb-1">
          Funnel.io — Spend by Channel
        </p>
        <p className="text-2xl font-heading font-semibold text-[#1a1a18] tabular-nums leading-none">
          ${total.toFixed(2)}
          <span className="text-sm ml-1.5 font-normal text-[#8a8880]">last 30 days</span>
        </p>
      </div>
      <div className="px-4 pb-5">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="channel"
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
