"use client";

import { useState, useTransition } from "react";
import { updateHiddenTaskLists } from "@/lib/actions/teamwork";
import { type TWTaskList } from "@/lib/teamwork";
import { CheckCircle2 } from "lucide-react";

interface Props {
  clientId: string;
  taskLists: TWTaskList[];
  hiddenTaskListIds: string[];
}

export function TeamworkTaskListToggles({ clientId, taskLists, hiddenTaskListIds }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set(hiddenTaskListIds ?? []));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    const next = new Set(hidden);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setHidden(next);
    setError(null);
    startTransition(async () => {
      try {
        await updateHiddenTaskLists(clientId, Array.from(next));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
        // Revert optimistic update
        setHidden(hidden);
      }
    });
  }

  if (taskLists.length === 0) {
    return <p className="text-sm text-[#8a8880] py-2">No task lists found in this project.</p>;
  }



  const overallTotal     = taskLists.reduce((s, tl) => s + tl.totalCount, 0);
  const overallCompleted = taskLists.reduce((s, tl) => s + tl.completedCount, 0);
  const overallPct       = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <div className="space-y-5">
      {error && (
        <div className="px-3 py-2 rounded-lg text-xs font-medium border bg-red-50 text-[#ff6b6c] border-red-200">
          {error}
        </div>
      )}
      {/* Overall progress */}
      {taskLists.length > 1 && (
        <div className="pb-4 border-b border-[#f0efe9]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[#464540]">Overall Progress</span>
            <span className="text-xs font-semibold text-[#464540]">
              {overallCompleted} of {overallTotal} tasks · {overallPct}%
            </span>
          </div>
          <div className="h-2 bg-[#f0efe9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#263a2e] rounded-full transition-all"
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Per-list rows */}
      <div className="space-y-4">
        {taskLists.map((tl) => {
          const isHidden = hidden.has(tl.id);
          return (
            <div key={tl.id} className={`transition-opacity ${isHidden ? "opacity-40" : ""}`}>
              <div className="flex items-center justify-between mb-1.5 gap-3">
                {/* Name + count */}
                <div className="flex items-center gap-2 min-w-0">
                  {tl.isComplete && !isHidden && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium truncate ${
                      tl.isComplete ? "text-[#8a8880] line-through" : "text-[#464540]"
                    }`}
                  >
                    {tl.name}
                  </span>
                  <span className="text-xs text-[#8a8880] flex-shrink-0">
                    {tl.totalCount > 0 ? `${tl.completedCount}/${tl.totalCount}` : tl.isComplete ? "Done" : ""}
                  </span>
                </div>

                {/* Visibility toggle */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-[#8a8880]">
                    {isHidden ? "Hidden" : "Visible"}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!isHidden}
                    disabled={isPending}
                    onClick={() => toggle(tl.id)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                      !isHidden ? "bg-[#263a2e]" : "bg-[#e2e0d9]"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                        !isHidden ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[#f0efe9] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    tl.isComplete ? "bg-emerald-500" : "bg-[#263a2e]"
                  }`}
                  style={{ width: `${tl.percentComplete}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-[#8a8880] pt-1">
        Toggling a task list off hides it from the client. All lists are visible by default.
      </p>
    </div>
  );
}
