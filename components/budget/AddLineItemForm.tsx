"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { addLineItem } from "@/lib/actions/budget";

type State = { error?: string; success?: boolean } | null;

export function AddLineItemForm({ budgetId }: { budgetId: string }) {
  const boundAction = addLineItem.bind(null, budgetId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  return (
    <form action={formAction} key={state?.success ? Date.now() : "lineitem"} className="space-y-3">
      {state?.error && <p className="text-xs text-[#ff6b6c]">{state.error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="category" className="text-xs">Category</Label>
          <Input id="category" name="category" placeholder="e.g. Media Buy" required
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount" className="text-xs">Amount ($)</Label>
          <Input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" required
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="description" className="text-xs">Description <span className="text-[#8a8880]">(optional)</span></Label>
          <Input id="description" name="description" placeholder="Details…"
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date" className="text-xs">Date <span className="text-[#8a8880]">(optional)</span></Label>
          <Input id="date" name="date" type="date"
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
        </div>
      </div>
      <div className="flex justify-end">
        <SubmitButton label="Add Line Item" loadingLabel="Adding…"
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs h-8 px-3" />
      </div>
    </form>
  );
}
