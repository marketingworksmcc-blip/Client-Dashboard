"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { CampaignDataPoint } from "@/lib/actions/meta";

interface Props {
  data: CampaignDataPoint[];
}

const COLORS = [
  "#1877f2",
  "#42a5f5",
  "#90caf9",
  "#263a2e",
  "#4a7c59",
  "#7aab8a",
  "#8a6a2e",
  "#c49a4a",
  "#6a7c8a",
  "#a0b4c0",
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CampaignDataPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const { campaign, value } = payload[0].payload;
  return (
    <div className="bg-white border border-[#e2e0d9] rounded-lg px-3 py-2 shadow-md text-xs max-w-[200px]">
      <p className="font-medium text-[#464540] mb-0.5 truncate">{campaign}</p>
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

export function MetaCampaignPieChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-[#8a8880]">
        No campaign data in the last 30 days.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e2e0d9] rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide mb-1">
          Spend by Campaign
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
              nameKey="campaign"
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
