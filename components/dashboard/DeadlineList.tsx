import { formatDate } from "@/lib/utils";
import { ImageIcon, CheckSquare, Calendar, AlertCircle } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

type DeadlineItem = {
  id: string;
  title: string;
  type: "proof" | "task";
  dueDate: Date;
  status: string;
};

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function DeadlineList({ items }: { items: DeadlineItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No upcoming deadlines"
        description="Due dates for proofs and tasks will appear here."
      />
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const days = daysUntil(item.dueDate);
        const isOverdue = days < 0;
        const isUrgent = days >= 0 && days <= 2;
        const Icon = item.type === "proof" ? ImageIcon : CheckSquare;

        return (
          <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-2.5 border-b border-[#f0efe9] last:border-0">
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
              item.type === "proof" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
            )}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#464540] truncate">{item.title}</p>
              <p className="text-xs text-[#8a8880] mt-0.5 capitalize">
                {item.type} · {formatDate(item.dueDate)}
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0",
              isOverdue
                ? "bg-[#ff6b6c]/10 text-[#ff6b6c]"
                : isUrgent
                ? "bg-amber-50 text-amber-600"
                : "bg-[#f0efe9] text-[#8a8880]"
            )}>
              {isOverdue && <AlertCircle className="h-3 w-3" />}
              {isOverdue
                ? `${Math.abs(days)}d overdue`
                : days === 0
                ? "Today"
                : days === 1
                ? "Tomorrow"
                : `${days}d`}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
