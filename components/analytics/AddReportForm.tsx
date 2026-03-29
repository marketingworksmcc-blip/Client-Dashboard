"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { createReport } from "@/lib/actions/analytics";

type State = { error?: string; success?: boolean } | null;

const REPORT_TYPES = [
  { value: "EXTERNAL_LINK", label: "External Link" },
  { value: "EMBEDDED", label: "Embedded (iframe)" },
  { value: "MANUAL", label: "Manual Metrics" },
];

export function AddReportForm({ clientId }: { clientId: string }) {
  const boundAction = createReport.bind(null, clientId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );
  const [reportType, setReportType] = useState("EXTERNAL_LINK");

  return (
    <form action={formAction} key={state?.success ? Date.now() : "report"} className="space-y-3">
      {state?.error && <p className="text-xs text-[#ff6b6c]">{state.error}</p>}
      <div className="space-y-1">
        <Label htmlFor="title" className="text-xs">Report Title</Label>
        <Input id="title" name="title" placeholder="e.g. Google Analytics — Q1" required
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="reportType" className="text-xs">Type</Label>
        <select id="reportType" name="reportType" value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c]">
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      {reportType !== "MANUAL" && (
        <div className="space-y-1">
          <Label htmlFor="reportUrl" className="text-xs">
            {reportType === "EMBEDDED" ? "Embed URL" : "Report URL"}
          </Label>
          <Input id="reportUrl" name="reportUrl" type="url"
            placeholder={reportType === "EMBEDDED" ? "https://lookerstudio.google.com/embed/…" : "https://analytics.google.com/…"}
            required
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
        </div>
      )}
      <div className="flex justify-end">
        <SubmitButton label="Add Report" loadingLabel="Adding…"
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs h-8 px-3" />
      </div>
    </form>
  );
}
