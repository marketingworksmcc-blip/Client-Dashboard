import { type TWTimeEntry } from "@/lib/teamwork";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

function formatTWDate(d: string): string {
  const s = d.replace(/-/g, "");
  if (s.length === 8) {
    const date = new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d;
}

function decimalHours(hours: number, minutes: number): string {
  return (hours + minutes / 60).toFixed(1);
}

export function TeamworkTimeCard({ entries }: { entries: TWTimeEntry[] }) {
  const totalMinutes = entries.reduce((sum, e) => sum + e.hours * 60 + e.minutes, 0);
  const totalH = Math.floor(totalMinutes / 60);
  const totalM = totalMinutes % 60;

  return (
    <Card className="border-[#e2e0d9]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Recent Time</CardTitle>
          <div className="flex items-center gap-1 text-xs text-[#8a8880]">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {totalH}h{totalM > 0 ? ` ${totalM}m` : ""} total
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <p className="text-sm text-[#8a8880] px-5 py-3">No time entries logged yet.</p>
        ) : (
          <div className="divide-y divide-[#f0efe9]">
            {entries.slice(0, 10).map((entry) => {
              const name = `${entry.person.firstName} ${entry.person.lastName}`.trim();
              return (
                <div key={entry.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    {entry.description ? (
                      <p className="text-sm text-[#464540] leading-snug truncate">{entry.description}</p>
                    ) : (
                      <p className="text-sm text-[#8a8880] italic">No description</p>
                    )}
                    <p className="text-xs text-[#8a8880] mt-0.5">{name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[#464540]">
                      {decimalHours(entry.hours, entry.minutes)}h
                    </p>
                    <p className="text-xs text-[#8a8880]">{formatTWDate(entry.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
