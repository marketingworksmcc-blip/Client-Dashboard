import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div>
        <h1 className="font-heading text-xl font-semibold text-[#464540] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="font-sans text-sm text-[#8a8880] mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">{children}</div>
      )}
    </div>
  );
}
