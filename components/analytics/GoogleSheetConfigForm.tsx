"use client";

import { useActionState, useState, useTransition } from "react";
import { saveGoogleSheetConfig, deleteGoogleSheetConfig } from "@/lib/actions/googleSheetConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SyncButton } from "@/components/analytics/SyncButton";
import { Info, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface GoogleSheetConfigFormProps {
  clientId: string;
  existing: {
    spreadsheetId: string;
    sheetName: string;
    range: string | null;
    lastSyncedAt: Date | string | null;
    lastSyncError: string | null;
    syncedRowCount: number | null;
  } | null;
  serviceAccountEmail: string | null;
}

export function GoogleSheetConfigForm({
  clientId,
  existing,
  serviceAccountEmail,
}: GoogleSheetConfigFormProps) {
  const [deleteIsPending, startDeleteTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(
    saveGoogleSheetConfig.bind(null, clientId),
    null
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleDelete() {
    startDeleteTransition(async () => {
      await deleteGoogleSheetConfig(clientId);
    });
  }

  const syncedAt = existing?.lastSyncedAt
    ? new Date(existing.lastSyncedAt)
    : null;

  return (
    <div className="space-y-5">
      {/* Service account info banner */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#f0efe9] border border-[#e2e0d9]">
        <Info className="h-4 w-4 text-[#8a8880] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#464540]">Share the sheet with this service account</p>
          {serviceAccountEmail ? (
            <code className="text-xs text-[#263a2e] bg-white border border-[#e2e0d9] px-2 py-0.5 rounded select-all">
              {serviceAccountEmail}
            </code>
          ) : (
            <p className="text-xs text-[#ff6b6c]">
              GOOGLE_SERVICE_ACCOUNT_EMAIL is not set. Configure it in your .env file.
            </p>
          )}
          <p className="text-xs text-[#8a8880]">
            Give it <strong>Viewer</strong> access in Google Sheets → Share.
          </p>
        </div>
      </div>

      {/* Config form */}
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#464540]">
            Spreadsheet ID <span className="text-[#ff6b6c]">*</span>
          </label>
          <Input
            name="spreadsheetId"
            defaultValue={existing?.spreadsheetId ?? ""}
            placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] font-mono text-sm"
          />
          <p className="text-xs text-[#8a8880]">
            Found in the spreadsheet URL: /spreadsheets/d/<strong>ID</strong>/edit
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#464540]">Sheet / Tab name</label>
            <Input
              name="sheetName"
              defaultValue={existing?.sheetName ?? "Sheet1"}
              placeholder="Sheet1"
              className="border-[#e2e0d9] focus-visible:ring-[#d3de2c]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#464540]">
              Range <span className="text-[#8a8880] font-normal">(optional)</span>
            </label>
            <Input
              name="range"
              defaultValue={existing?.range ?? ""}
              placeholder="e.g. A1:F100"
              className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] font-mono"
            />
          </div>
        </div>

        {state?.error && (
          <p className="text-xs text-[#ff6b6c] flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="text-xs text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            Sheet configuration saved.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-sm"
          >
            {isPending ? "Saving…" : existing ? "Update Config" : "Save Config"}
          </Button>

          {existing && !showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-[#8a8880] hover:text-[#ff6b6c] transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove config
            </button>
          )}

          {showDeleteConfirm && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#8a8880] text-xs">Remove sheet config?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteIsPending}
                className="text-xs text-[#ff6b6c] hover:underline"
              >
                Yes, remove
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs text-[#8a8880] hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Sync controls + status — only when config exists */}
      {existing && (
        <div className="pt-4 border-t border-[#f0efe9] space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <SyncButton clientId={clientId} />

            <div className="text-xs text-[#8a8880] space-y-0.5">
              {syncedAt ? (
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  Last synced {formatRelativeTime(syncedAt)}
                  {existing.syncedRowCount !== null && (
                    <span className="text-[#cad1cc]">
                      &nbsp;· {existing.syncedRowCount} data point{existing.syncedRowCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-[#cad1cc]">Not synced yet</p>
              )}
              {existing.lastSyncError && (
                <p className="flex items-start gap-1 text-[#ff6b6c]">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
                  {existing.lastSyncError}
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-[#8a8880] bg-[#f0efe9] rounded-lg px-3 py-2.5 leading-relaxed">
            <strong>Expected column format:</strong>{" "}
            <code className="text-[#464540]">
              Date | New Leads | Tasks Created | Tasks Completed | Hours Worked | Clients Onboarded
            </code>
            <br />
            Headers are case-insensitive. Extra columns are ignored. Date formats: YYYY-MM-DD, MM/DD/YYYY, or natural language.
          </div>
        </div>
      )}
    </div>
  );
}
