import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#f0efe9] flex items-center justify-center mb-4">
        <Icon className="h-5 w-5 text-[#8a8880]" />
      </div>
      <h3 className="text-sm font-semibold text-[#464540] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#8a8880] max-w-xs">{description}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
