"use client";

import { useState, useTransition } from "react";
import { saveSocialConfig, testSocialConnection, syncSocialData } from "@/lib/actions/social";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, CheckCircle2, AlertCircle, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialConfigFormProps {
  clientId: string;
  config: {
    enabled: boolean;
    accessToken: string;
    instagramUserId: string | null;
    facebookPageId: string | null;
    lastSyncedAt: string | null;
    lastSyncError: string | null;
  } | null;
}

export function SocialConfigForm({ clientId, config }: SocialConfigFormProps) {
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [accessToken, setAccessToken] = useState(config?.accessToken ?? "");
  const [instagramUserId, setInstagramUserId] = useState(config?.instagramUserId ?? "");
  const [facebookPageId, setFacebookPageId] = useState(config?.facebookPageId ?? "");

  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();
  const [isSyncing, startSync] = useTransition();

  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; igName?: string; pageName?: string; error?: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; posts?: number; error?: string } | null>(null);

  function handleSave() {
    setSaveResult(null);
    startSave(async () => {
      await saveSocialConfig(clientId, { enabled, accessToken, instagramUserId, facebookPageId });
      setSaveResult("success");
    });
  }

  function handleTest() {
    setTestResult(null);
    startTest(async () => {
      const res = await testSocialConnection(accessToken, instagramUserId, facebookPageId);
      setTestResult(res);
    });
  }

  function handleSync() {
    setSyncResult(null);
    startSync(async () => {
      const res = await syncSocialData(clientId);
      setSyncResult(res);
    });
  }

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
            enabled ? "bg-[#263a2e]" : "bg-[#e2e0d9]"
          )}
        >
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              enabled ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </button>
        <span className="text-sm font-medium text-[#464540]">
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {/* Credentials */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="social-token" className="text-xs font-medium text-[#464540]">
            Access Token
          </Label>
          <Input
            id="social-token"
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Long-lived Page or System User access token"
            className="text-sm border-[#e2e0d9] h-9"
          />
          <p className="text-xs text-[#8a8880]">
            Requires a long-lived Page access token with <code className="bg-[#f0efe9] px-1 rounded">instagram_basic</code>,{" "}
            <code className="bg-[#f0efe9] px-1 rounded">pages_read_engagement</code>, and{" "}
            <code className="bg-[#f0efe9] px-1 rounded">instagram_manage_insights</code> permissions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ig-user-id" className="text-xs font-medium text-[#464540]">
              Instagram User ID
            </Label>
            <Input
              id="ig-user-id"
              value={instagramUserId}
              onChange={(e) => setInstagramUserId(e.target.value)}
              placeholder="e.g. 17841400008460056"
              className="text-sm border-[#e2e0d9] h-9"
            />
            <p className="text-xs text-[#8a8880]">Instagram Business Account User ID (numeric)</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fb-page-id" className="text-xs font-medium text-[#464540]">
              Facebook Page ID
            </Label>
            <Input
              id="fb-page-id"
              value={facebookPageId}
              onChange={(e) => setFacebookPageId(e.target.value)}
              placeholder="e.g. 104256611111111"
              className="text-sm border-[#e2e0d9] h-9"
            />
            <p className="text-xs text-[#8a8880]">Facebook Page ID (numeric)</p>
          </div>
        </div>
      </div>

      {/* Test connection result */}
      {testResult && (
        <div
          className={cn(
            "flex items-start gap-2 text-xs px-3 py-2 rounded-lg border",
            testResult.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-[#ff6b6c]"
          )}
        >
          {testResult.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          )}
          <div>
            {testResult.ok ? (
              <>
                <p className="font-medium">Connection successful</p>
                {testResult.igName && <p>Instagram: @{testResult.igName}</p>}
                {testResult.pageName && <p>Facebook: {testResult.pageName}</p>}
              </>
            ) : (
              <p>{testResult.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Sync result */}
      {syncResult && (
        <div
          className={cn(
            "flex items-start gap-2 text-xs px-3 py-2 rounded-lg border",
            syncResult.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-[#ff6b6c]"
          )}
        >
          {syncResult.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          )}
          <p>
            {syncResult.ok
              ? `Synced ${syncResult.posts} post${syncResult.posts !== 1 ? "s" : ""} successfully.`
              : syncResult.error}
          </p>
        </div>
      )}

      {/* Sync status */}
      {config?.lastSyncedAt && !syncResult && (
        <p className="text-xs text-[#8a8880]">
          Last synced {new Date(config.lastSyncedAt).toLocaleString()}.
          {config.lastSyncError && (
            <span className="text-[#ff6b6c] ml-1">Last error: {config.lastSyncError}</span>
          )}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          size="sm"
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs h-8"
        >
          {isSaving ? "Saving…" : "Save Config"}
        </Button>

        {saveResult === "success" && (
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Saved
          </span>
        )}

        <Button
          type="button"
          onClick={handleTest}
          disabled={isTesting || !accessToken.trim()}
          size="sm"
          variant="outline"
          className="border-[#e2e0d9] text-[#464540] text-xs h-8 gap-1.5"
        >
          <Plug className={cn("h-3.5 w-3.5", isTesting && "animate-pulse")} />
          {isTesting ? "Testing…" : "Test Connection"}
        </Button>

        <Button
          type="button"
          onClick={handleSync}
          disabled={isSyncing || !config?.enabled}
          size="sm"
          variant="outline"
          className="border-[#263a2e] text-[#263a2e] hover:bg-[#263a2e]/5 text-xs h-8 gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? "Syncing…" : "Sync Now"}
        </Button>
      </div>
    </div>
  );
}
