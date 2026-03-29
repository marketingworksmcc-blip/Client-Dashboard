"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { FormError } from "@/components/shared/FormError";
import { updateUser } from "@/lib/actions/users";
import type { Role } from "@prisma/client";

type ActionState = { error?: string; success?: boolean } | null;

interface UpdateUserFormProps {
  userId: string;
  defaultName: string;
  defaultEmail: string;
  defaultRole: Role;
}

export function UpdateUserForm({ userId, defaultName, defaultEmail, defaultRole }: UpdateUserFormProps) {
  const boundAction = updateUser.bind(null, userId);
  const [state, formAction] = useActionState<ActionState, FormData>(
    boundAction as unknown as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state?.error} />
      {state?.success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
          <p className="text-sm text-emerald-700">Changes saved.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultName}
          required
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          required
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">
          New Password{" "}
          <span className="text-[#8a8880] font-normal">(leave blank to keep current)</span>
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Min. 8 characters"
          minLength={8}
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <Select name="role" defaultValue={defaultRole}>
          <SelectTrigger className="border-[#e2e0d9] focus:ring-[#d3de2c]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CLIENT_USER">Client User</SelectItem>
            <SelectItem value="CLIENT_ADMIN">Client Admin</SelectItem>
            <SelectItem value="REVEL_TEAM">Revel Team Member</SelectItem>
            <SelectItem value="REVEL_ADMIN">Revel Admin</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
          </SelectContent>
        </Select>
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
