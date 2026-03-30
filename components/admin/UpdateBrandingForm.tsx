"use client";

import { useActionState, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { FormError } from "@/components/shared/FormError";
import { updateClientBranding } from "@/lib/actions/clients";

type ActionState = { error?: string; success?: boolean } | null;

interface UpdateBrandingFormProps {
  clientId: string;
  defaults: {
    portalName: string;
    portalSubtitle: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundStyle: string;
  };
}

function ColorField({
  label,
  name,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: string;
}) {
  const [hex, setHex] = useState(defaultValue || "#000000");
  const pickerRef = useRef<HTMLInputElement>(null);

  function handleTextChange(value: string) {
    setHex(value);
    if (/^#[0-9a-fA-F]{6}$/.test(value) && pickerRef.current) {
      pickerRef.current.value = value;
    }
  }

  function handlePickerChange(value: string) {
    setHex(value);
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          ref={pickerRef}
          type="color"
          defaultValue={hex}
          onChange={(e) => handlePickerChange(e.target.value)}
          className="w-10 h-9 rounded-lg border border-[#e2e0d9] cursor-pointer p-0.5 shrink-0"
        />
        <Input
          name={name}
          value={hex}
          onChange={(e) => handleTextChange(e.target.value)}
          maxLength={7}
          className="font-mono text-sm border-[#e2e0d9] flex-1"
        />
      </div>
      {hint && <p className="text-xs text-[#8a8880]">{hint}</p>}
    </div>
  );
}

export function UpdateBrandingForm({ clientId, defaults }: UpdateBrandingFormProps) {
  const boundAction = updateClientBranding.bind(null, clientId);
  const [state, formAction] = useActionState<ActionState, FormData>(
    boundAction as unknown as (state: ActionState, formData: FormData) => Promise<ActionState>,
    null
  );

  const [logoMode, setLogoMode] = useState<"url" | "upload">(
    defaults.logoUrl && !defaults.logoUrl.startsWith("/logos/") ? "url" : "upload"
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-5">
      <FormError message={state?.error} />
      {state?.success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2">
          <p className="text-sm text-emerald-700">Branding saved.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="portalName">Portal Name</Label>
        <Input
          id="portalName"
          name="portalName"
          defaultValue={defaults.portalName}
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
        <p className="text-xs text-[#8a8880]">Shown in the sidebar header.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="portalSubtitle">Portal Subtitle</Label>
        <Input
          id="portalSubtitle"
          name="portalSubtitle"
          defaultValue={defaults.portalSubtitle}
          placeholder="e.g. Powered by Revel"
          className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>Logo</Label>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setLogoMode("upload")}
              className={`transition-colors ${logoMode === "upload" ? "font-medium text-[#263a2e]" : "text-[#8a8880] hover:text-[#464540]"}`}
            >
              Upload
            </button>
            <span className="text-[#e2e0d9]">|</span>
            <button
              type="button"
              onClick={() => setLogoMode("url")}
              className={`transition-colors ${logoMode === "url" ? "font-medium text-[#263a2e]" : "text-[#8a8880] hover:text-[#464540]"}`}
            >
              URL
            </button>
          </div>
        </div>

        {logoMode === "url" ? (
          <>
            <Input
              name="logoUrl"
              type="url"
              defaultValue={defaults.logoUrl?.startsWith("/logos/") ? "" : defaults.logoUrl}
              placeholder="https://..."
              className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
            />
            <p className="text-xs text-[#8a8880]">Direct link to a PNG, SVG, or WebP logo.</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <label
                htmlFor="logoFile"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-[#e2e0d9] rounded-lg cursor-pointer hover:bg-[#f0efe9] transition-colors text-[#464540]"
              >
                Choose file
              </label>
              <span className="text-sm text-[#8a8880] truncate">
                {uploadedFileName ?? (defaults.logoUrl?.startsWith("/logos/") ? defaults.logoUrl.split("/").pop() : "No file chosen")}
              </span>
              <input
                id="logoFile"
                name="logoFile"
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => setUploadedFileName(e.target.files?.[0]?.name ?? null)}
              />
            </div>
            {defaults.logoUrl?.startsWith("/logos/") && !uploadedFileName && (
              <input type="hidden" name="logoUrl" value={defaults.logoUrl} />
            )}
            <p className="text-xs text-[#8a8880]">PNG, SVG, JPG, or WebP. Max 2 MB.</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ColorField
          label="Primary Color"
          name="primaryColor"
          defaultValue={defaults.primaryColor}
          hint="Nav highlights and CTAs."
        />
        <ColorField
          label="Secondary Color"
          name="secondaryColor"
          defaultValue={defaults.secondaryColor}
          hint="Sidebar background."
        />
      </div>

      <div className="space-y-1.5">
        <Label>Background Style</Label>
        <Select name="backgroundStyle" defaultValue={defaults.backgroundStyle}>
          <SelectTrigger className="border-[#e2e0d9] focus:ring-[#d3de2c]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default (Warm Off-White)</SelectItem>
            <SelectItem value="light">Light (Pure White)</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end pt-2">
        <SubmitButton
          label="Save Branding"
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]"
        />
      </div>
    </form>
  );
}
