"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/shared/FormError";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { submitApproval } from "@/lib/actions/proofs";
import { CheckCircle, XCircle } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

export function ApprovalActions({ proofId }: { proofId: string }) {
  const boundAction = submitApproval.bind(null, proofId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  const [mode, setMode] = useState<"idle" | "approve" | "changes">("idle");

  if (state?.success) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
        <p className="text-sm font-medium text-emerald-700">Your response has been submitted.</p>
      </div>
    );
  }

  if (mode === "idle") {
    return (
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => setMode("approve")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve
        </Button>
        <Button
          onClick={() => setMode("changes")}
          variant="outline"
          className="border-[#ff6b6c]/30 text-[#ff6b6c] hover:bg-[#ff6b6c]/5 w-full"
        >
          <XCircle className="h-4 w-4 mr-2" />
          Request Changes
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="action" value={mode === "approve" ? "APPROVED" : "CHANGES_REQUESTED"} />
      <FormError message={state?.error} />

      {mode === "changes" && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#464540]">
            What changes are needed? <span className="text-[#ff6b6c]">*</span>
          </label>
          <textarea name="notes" rows={4} required autoFocus
            placeholder="Describe the changes you'd like to see…"
            className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c] resize-none" />
        </div>
      )}

      {mode === "approve" && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#464540]">
            Notes <span className="text-[#8a8880] font-normal">(optional)</span>
          </label>
          <textarea name="notes" rows={2}
            placeholder="Any final comments…"
            className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c] resize-none" />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="border-[#e2e0d9] flex-1"
          onClick={() => setMode("idle")}>
          Back
        </Button>
        <SubmitButton
          label={mode === "approve" ? "Confirm Approval" : "Submit Feedback"}
          loadingLabel="Submitting…"
          className={`flex-1 ${mode === "approve" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-[#ff6b6c] hover:bg-[#ff6b6c]/90 text-white"}`}
        />
      </div>
    </form>
  );
}
