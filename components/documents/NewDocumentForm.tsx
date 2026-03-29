"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { FormError } from "@/components/shared/FormError";
import { createDocument } from "@/lib/actions/documents";
import Link from "next/link";

type State = { error?: string } | null;

const STATUS_OPTIONS = [
  { value: "REFERENCE", label: "Reference" },
  { value: "REQUIRES_REVIEW", label: "Needs Review" },
  { value: "REQUIRES_SIGNATURE", label: "Needs Signature" },
];

export function NewDocumentForm({ clientId }: { clientId: string }) {
  const boundAction = createDocument.bind(null, clientId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  const [sourceMode, setSourceMode] = useState<"upload" | "url">("upload");
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state?.error} />

      <div className="space-y-1.5">
        <Label htmlFor="title">Document Title</Label>
        <Input id="title" name="title" placeholder="e.g. Q1 Strategy Brief" required autoFocus
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description <span className="text-[#8a8880] font-normal">(optional)</span></Label>
        <textarea id="description" name="description" rows={3}
          placeholder="Describe what this document is for…"
          className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c] resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category <span className="text-[#8a8880] font-normal">(optional)</span></Label>
          <Input id="category" name="category" placeholder="e.g. Contracts, Reports"
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status"
            className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c]">
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* File or URL */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>File</Label>
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
            <label htmlFor="file"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-[#e2e0d9] rounded-lg cursor-pointer hover:bg-[#f0efe9] transition-colors text-[#464540]">
              Choose file
            </label>
            <span className="text-sm text-[#8a8880] truncate">{fileName ?? "No file chosen"}</span>
            <input id="file" name="file" type="file"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
              className="sr-only"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
          </div>
        ) : (
          <Input name="externalUrl" type="url" placeholder="https://drive.google.com/…"
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]" />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href="..">Cancel</Link>
        </Button>
        <SubmitButton label="Upload Document" loadingLabel="Uploading…"
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]" />
      </div>
    </form>
  );
}
