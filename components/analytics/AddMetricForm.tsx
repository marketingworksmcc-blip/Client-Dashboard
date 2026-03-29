"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { addMetric } from "@/lib/actions/analytics";

type State = { error?: string; success?: boolean } | null;

export function AddMetricForm({ reportId }: { reportId: string }) {
  const boundAction = addMetric.bind(null, reportId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  return (
    <form action={formAction} key={state?.success ? Date.now() : "metric"} className="space-y-3">
      {state?.error && <p className="text-xs text-[#ff6b6c]">{state.error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="metricName" className="text-xs">Metric</Label>
          <Input id="metricName" name="metricName" placeholder="e.g. Impressions" required
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="metricValue" className="text-xs">Value</Label>
          <Input id="metricValue" name="metricValue" placeholder="e.g. 42,300" required
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes" className="text-xs">Notes <span className="text-[#8a8880]">(optional)</span></Label>
        <Input id="notes" name="notes" placeholder="Context or time period…"
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
      </div>
      <div className="flex justify-end">
        <SubmitButton label="Add Metric" loadingLabel="Adding…"
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs h-8 px-3" />
      </div>
    </form>
  );
}
