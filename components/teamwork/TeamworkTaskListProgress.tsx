import { type TWTaskList } from "@/lib/teamwork";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export function TeamworkTaskListProgress({
  taskLists,
  title = "Project Task Lists",
}: {
  taskLists: TWTaskList[];
  title?: string;
}) {
  if (taskLists.length === 0) {
    return (
      <Card className="border-[#e2e0d9]">
        <CardHeader className="pb-3">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#8a8880] py-2">No task lists found in this project.</p>
        </CardContent>
      </Card>
    );
  }

  const overallTotal     = taskLists.reduce((s, tl) => s + tl.totalCount, 0);
  const overallCompleted = taskLists.reduce((s, tl) => s + tl.completedCount, 0);
  const overallPct       = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <Card className="border-[#e2e0d9]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <span className="text-xs text-[#8a8880]">
            {overallCompleted} of {overallTotal} tasks complete
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Overall progress */}
        {taskLists.length > 1 && (
          <div className="pb-4 border-b border-[#f0efe9]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#464540]">Overall Progress</span>
              <span className="text-xs font-semibold text-[#464540]">{overallPct}%</span>
            </div>
            <div className="h-2.5 bg-[#f0efe9] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#263a2e] rounded-full transition-all"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Per-task-list progress */}
        <div className="space-y-4">
          {taskLists.map((tl) => (
            <div key={tl.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {tl.isComplete && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium truncate ${
                      tl.isComplete ? "text-[#8a8880] line-through" : "text-[#464540]"
                    }`}
                  >
                    {tl.name}
                  </span>
                </div>
                <span className="text-xs text-[#8a8880] flex-shrink-0 ml-3">
                  {tl.totalCount > 0
                    ? `${tl.completedCount}/${tl.totalCount}`
                    : tl.isComplete
                    ? "Done"
                    : ""}
                </span>
              </div>
              <div className="h-1.5 bg-[#f0efe9] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    tl.isComplete ? "bg-emerald-500" : "bg-[#263a2e]"
                  }`}
                  style={{ width: `${tl.percentComplete}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
