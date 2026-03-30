"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { updateDocument } from "@/lib/actions/documents";
import { Pencil, X } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

const STATUS_OPTIONS = [
  { value: "REFERENCE", label: "Reference" },
  { value: "REQUIRES_REVIEW", label: "Needs Review" },
  { value: "REQUIRES_SIGNATURE", label: "Needs Signature" },
];

interface EditDocumentFormProps {
  documentId: string;
  defaults: {
    title: string;
    description: string | null;
    category: string | null;
    status: string;
  };
}

export function EditDocumentForm({ documentId, defaults }: EditDocumentFormProps) {
  const [editing, setEditing] = useState(false);
  const boundAction = updateDocument.bind(null, documentId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  if (!editing) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setEditing(true)}
        className="text-[#8a8880] hover:text-[#464540] h-8 w-8 p-0">
        <Pencil className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="col-span-full border border-[#e2e0d9] rounded-xl bg-[#faf9f6] px-5 py-4">
      <form action={async (fd) => { await formAction(fd); setEditing(false); }} className="space-y-3">
        {state?.error && <p className="text-xs text-[#ff6b6c]">{state.error}</p>}
        <div className="space-y-1">
          <Label className="text-xs">Title</Label>
          <Input name="title" defaultValue={defaults.title} required
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input name="description" defaultValue={defaults.description ?? ""}
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Category</Label>
            <Input name="category" defaultValue={defaults.category ?? ""}
              className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <select name="status" defaultValue={defaults.status}
              className="w-full rounded-lg border border-[#e2e0d9] bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c]">
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}
            className="border-[#e2e0d9] h-8 text-xs">
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <SubmitButton label="Save" loadingLabel="Saving…"
            className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs h-8 px-4" />
        </div>
      </form>
    </div>
  );
}
