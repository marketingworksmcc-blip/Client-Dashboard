import { formatCurrency } from "@/lib/utils";

interface BudgetOverviewProps {
  name: string;
  period: string | null;
  totalAmount: number;
  spent: number;
}

export function BudgetOverview({ name, period, totalAmount, spent }: BudgetOverviewProps) {
  const remaining = totalAmount - spent;
  const pct = totalAmount > 0 ? Math.min((spent / totalAmount) * 100, 100) : 0;
  const isOver = spent > totalAmount;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#464540]">{name}</p>
          {period && <p className="text-xs text-[#8a8880] mt-0.5">{period}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-heading font-semibold text-[#464540]">
            {formatCurrency(spent)}
          </p>
          <p className="text-xs text-[#8a8880]">of {formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-2.5 rounded-full bg-[#f0efe9] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isOver ? "bg-[#ff6b6c]" : "bg-[#263a2e]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[#8a8880]">
          <span>{pct.toFixed(0)}% spent</span>
          <span className={isOver ? "text-[#ff6b6c] font-medium" : ""}>
            {isOver
              ? `${formatCurrency(Math.abs(remaining))} over budget`
              : `${formatCurrency(remaining)} remaining`}
          </span>
        </div>
      </div>
    </div>
  );
}
