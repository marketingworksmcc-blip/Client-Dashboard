"use client";

import { useState, useTransition } from "react";
import { setAnalyticsMode } from "@/lib/actions/googleSheetConfig";
import { BarChart2, Sheet, ExternalLink } from "lucide-react";
import type { AnalyticsMode } from "@prisma/client";

interface AnalyticsModeSelectorProps {
  clientId: string;
  current: AnalyticsMode;
}

const MODES: {
  value: AnalyticsMode;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "MANUAL",
    label: "Manual Entry",
    description: "Enter data points directly in the admin. Full control, no external dependency.",
    icon: BarChart2,
  },
  {
    value: "GOOGLE_SHEET",
    label: "Google Sheet",
    description: "Sync from a shared Google Sheet. Configure the spreadsheet below after selecting.",
    icon: Sheet,
  },
  {
    value: "LOOKER_STUDIO",
    label: "Looker Studio",
    description: "Embed or link a Looker Studio report. Manage links in the Report Links section.",
    icon: ExternalLink,
  },
];

export function AnalyticsModeSelector({ clientId, current }: AnalyticsModeSelectorProps) {
  const [selected, setSelected] = useState<AnalyticsMode>(current);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSelect(mode: AnalyticsMode) {
    setSelected(mode);
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await setAnalyticsMode(clientId, selected);
      setSaved(true);
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MODES.map(({ value, label, description, icon: Icon }) => {
          const active = selected === value;
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                active
                  ? "border-[#263a2e] bg-[#263a2e]/5"
                  : "border-[#e2e0d9] bg-white hover:border-[#263a2e]/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`h-4 w-4 flex-shrink-0 ${active ? "text-[#263a2e]" : "text-[#8a8880]"}`} />
                <span className={`text-sm font-semibold ${active ? "text-[#263a2e]" : "text-[#464540]"}`}>
                  {label}
                </span>
              </div>
              <p className="text-xs text-[#8a8880] leading-relaxed">{description}</p>
            </button>
          );
        })}
      </div>

      {selected !== current && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] rounded-lg text-sm font-medium disabled:opacity-60 transition-colors"
          >
            {isPending ? "Saving…" : "Save Mode"}
          </button>
          <button
            onClick={() => { setSelected(current); setSaved(false); }}
            className="text-sm text-[#8a8880] hover:text-[#464540] transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {saved && selected === current && (
        <p className="text-xs text-emerald-600">Mode updated.</p>
      )}
    </div>
  );
}
