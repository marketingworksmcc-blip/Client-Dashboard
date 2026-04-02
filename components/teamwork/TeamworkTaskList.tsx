import { type TWTask } from "@/lib/teamwork";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const priorityConfig: Record<string, { label: string; dot: string }> = {
  urgent: { label: "Urgent", dot: "bg-[#ff6b6c]" },
  high:   { label: "High",   dot: "bg-amber-500" },
  medium: { label: "Medium", dot: "bg-blue-400"  },
  low:    { label: "Low",    dot: "bg-[#cad1cc]" },
  none:   { label: "",       dot: "bg-[#e2e0d9]" },
};

function formatTWDate(d: string | null): string | null {
  if (!d) return null;
  const s = d.replace(/-/g, "");
  if (s.length === 8) {
    const date = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d;
}

function isOverdue(d: string | null): boolean {
  if (!d) return false;
  const s = d.replace(/-/g, "");
  if (s.length !== 8) return false;
  const date = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
  return date < new Date(new Date().toDateString());
}

export function TeamworkTaskList({ tasks, title = "Teamwork Tasks" }: { tasks: TWTask[]; title?: string }) {
  if (tasks.length === 0) {
    return (
      <Card className="border-[#e2e0d9]">
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#8a8880] py-2">No open tasks — all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#e2e0d9]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <span className="text-xs text-[#8a8880]">{tasks.length} open</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[#f0efe9]">
          {tasks.map((task) => {
            const p = priorityConfig[task.priority] ?? priorityConfig.none;
            const due = formatTWDate(task.dueDate);
            const overdue = isOverdue(task.dueDate);
            const assigneeNames = task.assignees
              .map((a) => `${a.firstName} ${a.lastName}`.trim())
              .join(", ");

            return (
              <div key={task.id} className="flex items-start gap-3 px-5 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${p.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#464540] font-medium leading-snug">{task.name}</p>
                  {assigneeNames && (
                    <p className="text-xs text-[#8a8880] mt-0.5">{assigneeNames}</p>
                  )}
                </div>
                {due && (
                  <span
                    className={`text-xs flex-shrink-0 font-medium ${
                      overdue ? "text-[#ff6b6c]" : "text-[#8a8880]"
                    }`}
                  >
                    {overdue ? "Overdue · " : ""}{due}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
