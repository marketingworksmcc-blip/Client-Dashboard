"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-6 w-6 text-[#ff6b6c]" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-[#1a1a18] mb-2">Something went wrong</h2>
        <p className="text-sm text-[#8a8880] mb-5">
          An unexpected error occurred. Try again or contact support if the problem persists.
        </p>
        <Button onClick={reset} className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]">
          Try again
        </Button>
      </div>
    </div>
  );
}
