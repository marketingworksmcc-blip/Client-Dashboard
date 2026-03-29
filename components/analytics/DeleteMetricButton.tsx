"use client";

import { useTransition } from "react";
import { deleteMetric } from "@/lib/actions/analytics";
import { X } from "lucide-react";

export function DeleteMetricButton({ metricId }: { metricId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => deleteMetric(metricId))}
      className="text-[#8a8880] hover:text-[#ff6b6c] transition-colors disabled:opacity-40"
      aria-label="Delete metric"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
