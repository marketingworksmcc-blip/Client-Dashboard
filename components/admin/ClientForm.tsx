"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { FormError } from "@/components/shared/FormError";
import { ClientSlugPreview } from "@/components/admin/ClientSlugPreview";
import { createClient } from "@/lib/actions/clients";
import Link from "next/link";

type ActionState = { error?: string; success?: boolean } | null;

export function NewClientForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createClient as unknown as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state?.error} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Client Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Acme Co"
          required
          autoFocus
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
        <p className="text-xs text-[#8a8880]">
          The display name shown in the admin and portal header.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">
          URL Slug{" "}
          <span className="text-[#8a8880] font-normal">(optional — auto-generated from name)</span>
        </Label>
        <ClientSlugPreview />
        <p className="text-xs text-[#8a8880]">Lowercase letters, numbers, and hyphens only.</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href="/admin/clients">Cancel</Link>
        </Button>
        <SubmitButton
          label="Create Client"
          loadingLabel="Creating…"
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]"
        />
      </div>
    </form>
  );
}
