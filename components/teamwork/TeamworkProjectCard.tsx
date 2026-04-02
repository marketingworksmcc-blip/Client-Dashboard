import { type TWProject } from "@/lib/teamwork";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Calendar } from "lucide-react";

function formatTWDate(d: string | null): string {
  if (!d) return "";
  // Teamwork dates can be "YYYYMMDD" or "YYYY-MM-DD"
  const s = d.replace(/-/g, "");
  if (s.length === 8) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return d;
}

export function TeamworkProjectCard({ project }: { project: TWProject }) {
  const pct = project.percentComplete;

  return (
    <Card className="border-[#e2e0d9]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>{project.name}</CardTitle>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              project.status === "completed"
                ? "bg-emerald-50 text-emerald-700"
                : project.status === "on-hold"
                ? "bg-amber-50 text-amber-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {project.status.replace(/-/g, " ")}
          </span>
        </div>
        {project.description && (
          <p className="text-xs text-[#8a8880] mt-0.5 line-clamp-2">{project.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-[#8a8880]">
              {project.completedTaskCount} of {project.totalTaskCount} tasks completed
            </span>
            <span className="text-xs font-semibold text-[#464540]">{pct}%</span>
          </div>
          <div className="h-2 bg-[#f0efe9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#263a2e] rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Dates */}
        {(project.startDate || project.endDate) && (
          <div className="flex items-center gap-4 text-xs text-[#8a8880]">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            {project.startDate && <span>Start: {formatTWDate(project.startDate)}</span>}
            {project.endDate && <span>End: {formatTWDate(project.endDate)}</span>}
          </div>
        )}

        {pct === 100 && (
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            All tasks completed
          </div>
        )}
      </CardContent>
    </Card>
  );
}
