"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  label: string;
  loadingLabel?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost";
}

export function SubmitButton({
  label,
  loadingLabel,
  className,
  variant = "default",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      variant={variant}
      className={cn("min-w-[100px]", className)}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingLabel ?? "Saving…"}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
