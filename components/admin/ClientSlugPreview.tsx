"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils";

export function ClientSlugPreview() {
  const [slug, setSlug] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(slugify(e.target.value));
  }

  return (
    <div className="space-y-1.5">
      <Input
        id="slug"
        name="slug"
        value={slug}
        onChange={handleChange}
        placeholder="auto-generated from name"
        className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] font-mono text-sm"
      />
      {slug && (
        <p className="text-xs text-[#8a8880]">
          Preview:{" "}
          <code className="bg-[#f0efe9] px-1 py-0.5 rounded text-[#464540]">
            {slug}
          </code>
        </p>
      )}
    </div>
  );
}
