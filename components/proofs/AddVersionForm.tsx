"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { FormError } from "@/components/shared/FormError";
import { addProofVersion } from "@/lib/actions/proofs";

type State = { error?: string; success?: boolean } | null;

export function AddVersionForm({ proofId }: { proofId: string }) {
  const boundAction = addProofVersion.bind(null, proofId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  const [sourceMode, setSourceMode] = useState<"upload" | "url">("upload");
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state?.error} />
      {state?.success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
          <p className="text-sm text-emerald-700">New version uploaded. Status reset to Pending Review.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>New Version File</Label>
          <div className="flex items-center gap-2 text-xs">
            <button type="button" onClick={() => setSourceMode("upload")}
              className={`transition-colors ${sourceMode === "upload" ? "font-medium text-[#263a2e]" : "text-[#8a8880] hover:text-[#464540]"}`}>
              Upload
            </button>
            <span className="text-[#e2e0d9]">|</span>
            <button type="button" onClick={() => setSourceMode("url")}
              className={`transition-colors ${sourceMode === "url" ? "font-medium text-[#263a2e]" : "text-[#8a8880] hover:text-[#464540]"}`}>
              External Link
            </button>
          </div>
        </div>

        {sourceMode === "upload" ? (
          <div className="flex items-center gap-3">
            <label htmlFor="version-file"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-[#e2e0d9] rounded-lg cursor-pointer hover:bg-[#f0efe9] transition-colors text-[#464540]">
              Choose file
            </label>
            <span className="text-sm text-[#8a8880] truncate">{fileName ?? "No file chosen"}</span>
            <input id="version-file" name="file" type="file"
              accept="image/*,application/pdf,.ai,.psd,.sketch,.fig,.xd,.zip"
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
          </div>
        ) : (
          <Input name="externalUrl" type="url" placeholder="https://figma.com/…"
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]" />
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Version Notes <span className="text-[#8a8880] font-normal">(optional)</span></Label>
        <Input id="notes" name="notes" placeholder="e.g. Applied feedback from round 1"
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]" />
      </div>

      <SubmitButton label="Upload Version" loadingLabel="Uploading…"
        className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] w-full" />
    </form>
  );
}
