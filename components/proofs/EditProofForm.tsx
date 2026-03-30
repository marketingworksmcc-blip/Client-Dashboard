"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { updateProof } from "@/lib/actions/proofs";
import { Pencil, X } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

interface EditProofFormProps {
  proofId: string;
  defaults: { title: string; description: string | null; dueDate: Date | null };
}

export function EditProofForm({ proofId, defaults }: EditProofFormProps) {
  const [editing, setEditing] = useState(false);
  const boundAction = updateProof.bind(null, proofId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  if (!editing) {
    return (
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}
        className="w-full border-[#e2e0d9] text-[#464540] text-xs h-8">
        <Pencil className="h-3.5 w-3.5 mr-1.5" />
        Edit Details
      </Button>
    );
  }

  return (
    <form action={async (fd) => { await formAction(fd); setEditing(false); }} className="space-y-3">
      {state?.error && <p className="text-xs text-[#ff6b6c]">{state.error}</p>}
      <div className="space-y-1">
        <Label className="text-xs">Title</Label>
        <Input name="title" defaultValue={defaults.title} required
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <textarea name="description" rows={2} defaultValue={defaults.description ?? ""}
          className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c] resize-none" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Due Date</Label>
        <Input name="dueDate" type="date"
          defaultValue={defaults.dueDate ? defaults.dueDate.toISOString().split("T")[0] : ""}
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm" />
      </div>
      <div className="flex gap-2">
        <SubmitButton label="Save" loadingLabel="Saving…"
          className="flex-1 bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs h-8" />
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}
          className="border-[#e2e0d9] h-8 px-2">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}
