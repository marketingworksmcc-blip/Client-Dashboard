"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { FormError } from "@/components/shared/FormError";
import { setPassword } from "@/lib/actions/setPassword";
import { Eye, EyeOff } from "lucide-react";

type State = { error?: string } | null;

export function SetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState<State, FormData>(setPassword, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <FormError message={state?.error} />

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-[#464540]">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            minLength={8}
            required
            autoFocus
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a8880] hover:text-[#464540] transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-[#464540]">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          placeholder="Re-enter your password"
          required
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
      </div>

      <SubmitButton
        label="Set password & sign in"
        loadingLabel="Saving…"
        className="w-full bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] font-medium"
      />
    </form>
  );
}
