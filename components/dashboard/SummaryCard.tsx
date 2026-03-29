import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-[#464540]",
  iconBg = "bg-[#f0efe9]",
  trend,
  className,
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "border-[#e2e0d9] shadow-none hover:shadow-sm transition-shadow duration-200",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Label — Inter */}
            <p className="font-sans text-xs font-medium text-[#8a8880] uppercase tracking-wide mb-2">
              {title}
            </p>
            {/* Value — Source Serif (display number) */}
            <p className="font-heading text-2xl font-semibold text-[#464540] tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="font-sans text-xs text-[#8a8880] mt-1">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "font-sans text-xs mt-1 font-medium",
                  trend.positive ? "text-emerald-600" : "text-[#ff6b6c]"
                )}
              >
                {trend.value}
              </p>
            )}
          </div>
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3",
              iconBg
            )}
          >
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
