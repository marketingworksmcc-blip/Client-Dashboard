"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { FormError } from "@/components/shared/FormError";
import { createTask } from "@/lib/actions/tasks";
import Link from "next/link";

type State = { error?: string } | null;

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

interface NewTaskFormProps {
  clientId: string;
  assignableUsers: { id: string; name: string }[];
}

export function NewTaskForm({ clientId, assignableUsers }: NewTaskFormProps) {
  const boundAction = createTask.bind(null, clientId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state?.error} />

      <div className="space-y-1.5">
        <Label htmlFor="title">Task Title</Label>
        <Input id="title" name="title" placeholder="e.g. Review homepage copy" required autoFocus
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description <span className="text-[#8a8880] font-normal">(optional)</span></Label>
        <textarea id="description" name="description" rows={4}
          placeholder="Add details, context, or instructions…"
          className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c] resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select id="priority" name="priority" defaultValue="MEDIUM"
            className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c]">
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date <span className="text-[#8a8880] font-normal">(optional)</span></Label>
          <Input id="dueDate" name="dueDate" type="date"
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]" />
        </div>
      </div>

      {assignableUsers.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="assignedToId">Assign To <span className="text-[#8a8880] font-normal">(optional)</span></Label>
          <select id="assignedToId" name="assignedToId"
            className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c]">
            <option value="">Unassigned</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input id="allowClientUpdate" name="allowClientUpdate" type="checkbox"
          className="h-4 w-4 rounded border-[#e2e0d9] accent-[#263a2e]" />
        <Label htmlFor="allowClientUpdate" className="font-normal text-sm text-[#464540] cursor-pointer">
          Allow client to update status
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href="..">Cancel</Link>
        </Button>
        <SubmitButton label="Create Task" loadingLabel="Creating…"
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]" />
      </div>
    </form>
  );
}
