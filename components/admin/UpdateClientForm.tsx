"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { FormError } from "@/components/shared/FormError";
import { updateClient } from "@/lib/actions/clients";
import { formatDate } from "@/lib/utils";

type ActionState = { error?: string; success?: boolean } | null;

interface UpdateClientFormProps {
  clientId: string;
  defaultName: string;
  slug: string;
  createdAt: Date;
}

export function UpdateClientForm({ clientId, defaultName, slug, createdAt }: UpdateClientFormProps) {
  const boundAction = updateClient.bind(null, clientId);
  const [state, formAction] = useActionState<ActionState, FormData>(
    boundAction as unknown as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null
  );

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <FormError message={state?.error} />

      {state?.success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
          <p className="text-sm text-emerald-700">Changes saved.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Client Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultName}
          required
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
      </div>
      <div className="space-y-1.5">
        <Label>URL Slug</Label>
        <code className="block text-sm bg-[#f0efe9] px-3 py-2 rounded-lg text-[#464540]">
          {slug}
        </code>
        <p className="text-xs text-[#8a8880]">Slug cannot be changed after creation.</p>
      </div>
      <div className="space-y-1.5">
        <Label>Created</Label>
        <p className="text-sm text-[#8a8880]">{formatDate(createdAt)}</p>
      </div>
      <div className="flex justify-end">
        <SubmitButton
          label="Save Changes"
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]"
        />
      </div>
    </form>
  );
}
