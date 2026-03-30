"use client";

import { useState, useTransition } from "react";
import { syncGoogleSheet } from "@/lib/actions/syncSheet";
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SyncButtonProps {
  clientId: string;
}

export function SyncButton({ clientId }: SyncButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { type: "success"; count: number }
    | { type: "error"; message: string }
    | null
  >(null);

  function handleSync() {
    setResult(null);
    startTransition(async () => {
      const res = await syncGoogleSheet(clientId);
      if ("error" in res) {
        setResult({ type: "error", message: res.error });
      } else {
        setResult({ type: "success", count: res.count });
      }
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        onClick={handleSync}
        disabled={isPending}
        size="sm"
        variant="outline"
        className="border-[#263a2e] text-[#263a2e] hover:bg-[#263a2e]/5 text-xs h-8 gap-1.5"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? "Syncing…" : "Sync Now"}
      </Button>

      {result?.type === "success" && (
        <span className="text-xs text-emerald-600 flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Synced {result.count} data point{result.count !== 1 ? "s" : ""}
        </span>
      )}
      {result?.type === "error" && (
        <span className="text-xs text-[#ff6b6c] flex items-center gap-1.5 max-w-xs">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {result.message}
        </span>
      )}
    </div>
  );
}
