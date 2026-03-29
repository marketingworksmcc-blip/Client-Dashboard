"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { FormError } from "@/components/shared/FormError";
import { createUser } from "@/lib/actions/users";
import Link from "next/link";

type ActionState = { error?: string; success?: boolean } | null;
type Client = { id: string; name: string };

interface NewUserFormProps {
  clients: Client[];
  defaultClientId?: string;
}

export function NewUserForm({ clients, defaultClientId }: NewUserFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createUser as unknown as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state?.error} />

      <div className="space-y-1.5">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Jane Smith"
          required
          autoFocus
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="jane@company.com"
          required
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          required
          minLength={8}
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <Select name="role" required defaultValue="CLIENT_USER">
          <SelectTrigger className="border-[#e2e0d9] focus:ring-[#d3de2c]">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CLIENT_USER">Client User</SelectItem>
            <SelectItem value="CLIENT_ADMIN">Client Admin</SelectItem>
            <SelectItem value="REVEL_TEAM">Revel Team Member</SelectItem>
            <SelectItem value="REVEL_ADMIN">Revel Admin</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-[#8a8880]">
          Client roles require a client assignment below.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="clientId">
          Assign to Client{" "}
          <span className="text-[#8a8880] font-normal">(required for client roles)</span>
        </Label>
        <Select name="clientId" defaultValue={defaultClientId ?? ""}>
          <SelectTrigger className="border-[#e2e0d9] focus:ring-[#d3de2c]">
            <SelectValue placeholder="Select a client (optional)" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href="/admin/users">Cancel</Link>
        </Button>
        <SubmitButton
          label="Create User"
          loadingLabel="Creating…"
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]"
        />
      </div>
    </form>
  );
}
