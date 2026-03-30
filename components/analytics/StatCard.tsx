import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number | null;
  changeLabel?: string;
  suffix?: string;
}

export function StatCard({ label, value, change, changeLabel, suffix }: StatCardProps) {
  const isPositive = change != null && change > 0;
  const isNegative = change != null && change < 0;
  const isNeutral = change == null || change === 0;

  return (
    <div className="bg-white border border-[#e2e0d9] rounded-xl px-5 py-4 space-y-2 shadow-sm">
      <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-heading font-semibold text-[#1a1a18] tabular-nums leading-none">
        {value}
        {suffix && <span className="text-lg ml-0.5 font-normal text-[#8a8880]">{suffix}</span>}
      </p>
      {change != null && (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full",
              isPositive && "bg-emerald-50 text-emerald-700",
              isNegative && "bg-red-50 text-[#ff6b6c]",
              isNeutral && "bg-[#f0efe9] text-[#8a8880]"
            )}
          >
            {isPositive && <TrendingUp className="h-3 w-3" />}
            {isNegative && <TrendingDown className="h-3 w-3" />}
            {isNeutral && <Minus className="h-3 w-3" />}
            {isPositive ? "+" : ""}{change.toFixed(1)}%
          </span>
          {changeLabel && (
            <span className="text-xs text-[#8a8880]">{changeLabel}</span>
          )}
        </div>
      )}
      {change == null && (
        <p className="text-xs text-[#8a8880]">No previous data</p>
      )}
    </div>
  );
}
