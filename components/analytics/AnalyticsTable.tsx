import { cn } from "@/lib/utils";
import Link from "next/link";
import { CopyEmailButton } from "@/components/analytics/CopyEmailButton";

interface TaskRow {
  id: string;
  title: string;
  priority: string;
  dueDate: Date | null;
  assignedToName: string | null;
  assignedToEmail: string | null;
  clientId: string;
}

interface AnalyticsTableProps {
  tasks: TaskRow[];
  viewAllHref?: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-[#f0efe9] text-[#8a8880]",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-amber-50 text-amber-700",
  URGENT: "bg-red-50 text-[#ff6b6c]",
};

function formatDue(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AnalyticsTable({ tasks, viewAllHref }: AnalyticsTableProps) {
  return (
    <div className="bg-white border border-[#e2e0d9] rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0efe9]">
        <div>
          <p className="text-sm font-semibold text-[#1a1a18]">Upcoming Tasks</p>
          <p className="text-xs text-[#8a8880] mt-0.5">{tasks.length} open task{tasks.length !== 1 ? "s" : ""} with deadlines</p>
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-[#263a2e] hover:underline"
          >
            View all tasks →
          </Link>
        )}
      </div>

      {/* Table */}
      {tasks.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[#8a8880]">
          No upcoming tasks with deadlines.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f0efe9]">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Task</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Priority</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Assigned To</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#8a8880] uppercase tracking-wide">Deadline</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0efe9]">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-[#faf9f6] transition-colors group">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/tasks/${t.id}`}
                      className="font-medium text-[#464540] hover:text-[#1a1a18] transition-colors line-clamp-1"
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                      PRIORITY_STYLES[t.priority] ?? PRIORITY_STYLES.MEDIUM
                    )}>
                      {t.priority.charAt(0) + t.priority.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8a8880]">
                    {t.assignedToName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8a8880] tabular-nums">
                    {formatDue(t.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.assignedToEmail && (
                      <CopyEmailButton email={t.assignedToEmail} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
