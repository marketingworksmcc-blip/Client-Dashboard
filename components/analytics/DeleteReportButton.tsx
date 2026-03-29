"use client";

import { useTransition } from "react";
import { deleteReport } from "@/lib/actions/analytics";
import { Trash2 } from "lucide-react";

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => deleteReport(reportId))}
      className="text-[#8a8880] hover:text-[#ff6b6c] transition-colors disabled:opacity-40"
      aria-label="Delete report"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
