"use client";

import { useState, useTransition } from "react";
import {
  saveMetaConfig,
  testMetaConnection,
  syncMeta,
  type MetaMetricMapping,
} from "@/lib/actions/meta";
import { META_METRICS } from "@/lib/meta-metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Play, RefreshCw, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { MetaCreativesPreview } from "@/components/analytics/MetaCreativesPreview";

interface MetricOption {
  id: string;
  name: string;
}

interface ExistingConfig {
  enabled: boolean;
  adAccountId: string;
  accessToken: string;
  mappings: MetaMetricMapping[];
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
}

interface Props {
  clientId: string;
  metrics: MetricOption[];
  config: ExistingConfig | null;
}

export function MetaConfigForm({ clientId, metrics, config }: Props) {
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [adAccountId, setAdAccountId] = useState(config?.adAccountId ?? "");
  const [accessToken, setAccessToken] = useState(config?.accessToken ?? "");
  const [mappings, setMappings] = useState<MetaMetricMapping[]>(
    config?.mappings?.length ? config.mappings : [{ metaMetric: "", metricId: "" }]
  );
  const [testStatus, setTestStatus] = useState<"idle" | "ok" | "error">("idle");
  const [testAccountName, setTestAccountName] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();
  const [isSyncing, startSync] = useTransition();

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function addMapping() {
    setMappings((prev) => [...prev, { metaMetric: "", metricId: "" }]);
  }

  function removeMapping(index: number) {
    setMappings((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMapping(index: number, field: keyof MetaMetricMapping, value: string) {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function handleSave() {
    if (!adAccountId.trim()) { showMessage("error", "Ad Account ID is required."); return; }
    if (!accessToken.trim()) { showMessage("error", "Access token is required."); return; }
    startSave(async () => {
      try {
        await saveMetaConfig(clientId, {
          enabled,
          adAccountId,
          accessToken,
          mappings: mappings.filter((m) => m.metaMetric && m.metricId),
        });
        showMessage("success", "Meta configuration saved.");
      } catch {
        showMessage("error", "Failed to save configuration.");
      }
    });
  }

  function handleTest() {
    if (!adAccountId.trim() || !accessToken.trim()) {
      showMessage("error", "Enter an Ad Account ID and access token first.");
      return;
    }
    setTestStatus("idle");
    setTestAccountName(null);
    setSyncResult(null);
    startTest(async () => {
      try {
        const result = await testMetaConnection(adAccountId, accessToken);
        if (result.ok) {
          setTestStatus("ok");
          setTestAccountName(result.accountName ?? null);
        } else {
          setTestStatus("error");
          showMessage("error", result.error ?? "Connection failed.");
        }
      } catch {
        setTestStatus("error");
        showMessage("error", "Test failed unexpectedly.");
      }
    });
  }

  function handleSync() {
    setSyncResult(null);
    startSync(async () => {
      try {
        const result = await syncMeta(clientId);
        if (result.ok) {
          setSyncResult(`Synced ${result.synced} metric${result.synced !== 1 ? "s" : ""} for the last 30 days.`);
        } else {
          showMessage("error", `Sync failed: ${result.error}`);
        }
      } catch {
        showMessage("error", "Sync failed unexpectedly.");
      }
    });
  }

  const isPending = isSaving || isTesting || isSyncing;

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between py-3 border-b border-[#f0efe9]">
        <div>
          <p className="text-sm font-medium text-[#464540]">Enable Meta Ads Sync</p>
          <p className="text-xs text-[#8a8880] mt-0.5">
            Pull Facebook &amp; Instagram ad metrics into client dashboards
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? "bg-[#263a2e]" : "bg-[#e2e0d9]"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Ad Account ID */}
      <div className="space-y-1.5">
        <Label htmlFor="meta-account-id" className="text-xs font-medium text-[#464540]">
          Ad Account ID
        </Label>
        <div className="flex items-center">
          <span className="flex items-center px-3 h-9 border border-r-0 border-[#e2e0d9] rounded-l-md bg-[#f9f8f5] text-xs text-[#8a8880]">
            act_
          </span>
          <Input
            id="meta-account-id"
            value={adAccountId}
            onChange={(e) => setAdAccountId(e.target.value.replace(/^act_/, ""))}
            placeholder="123456789"
            className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e] rounded-l-none"
          />
        </div>
        <p className="text-xs text-[#8a8880]">
          Found in Meta Business Suite → Settings → Ad Accounts, or in the Ads Manager URL.
        </p>
      </div>

      {/* Access token */}
      <div className="space-y-1.5">
        <Label htmlFor="meta-token" className="text-xs font-medium text-[#464540]">
          Access Token
        </Label>
        <Input
          id="meta-token"
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="EAAxxxxxxxxx…"
          className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e]"
        />
        <p className="text-xs text-[#8a8880]">
          Use a System User access token from Meta Business Suite → Settings → System Users for
          long-lived access without expiry.
        </p>
      </div>

      {/* Test connection */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleTest}
          disabled={isPending}
          className="border-[#e2e0d9] h-8 text-xs text-[#464540]"
        >
          <Play className="h-3.5 w-3.5 mr-1" />
          {isTesting ? "Testing…" : "Test Connection"}
        </Button>
        {testStatus === "ok" && (
          <span className="flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {testAccountName ? `Connected — ${testAccountName}` : "Connected successfully"}
          </span>
        )}
        {testStatus === "error" && (
          <span className="flex items-center gap-1 text-xs text-[#ff6b6c]">
            <XCircle className="h-3.5 w-3.5" />
            Connection failed
          </span>
        )}
      </div>

      {/* Metric mappings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-[#464540]">Metric Mappings</Label>
          <button
            type="button"
            onClick={addMapping}
            className="flex items-center gap-1 text-xs text-[#8a8880] hover:text-[#464540] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add mapping
          </button>
        </div>
        <p className="text-xs text-[#8a8880] -mt-1">
          Map Meta Ads metrics to your client dashboard metrics.
        </p>

        {mappings.length === 0 && (
          <p className="text-xs text-[#8a8880] py-2">No mappings yet.</p>
        )}

        {mappings.map((mapping, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={mapping.metaMetric}
              onChange={(e) => updateMapping(index, "metaMetric", e.target.value)}
              className="h-8 flex-1 rounded-md border border-[#e2e0d9] bg-white px-2 text-xs text-[#464540] focus:outline-none focus:ring-1 focus:ring-[#263a2e]"
            >
              <option value="">Meta metric…</option>
              {META_METRICS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-[#8a8880] flex-shrink-0">→</span>
            <select
              value={mapping.metricId}
              onChange={(e) => updateMapping(index, "metricId", e.target.value)}
              className="h-8 flex-1 rounded-md border border-[#e2e0d9] bg-white px-2 text-xs text-[#464540] focus:outline-none focus:ring-1 focus:ring-[#263a2e]"
            >
              <option value="">Dashboard metric…</option>
              {metrics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeMapping(index)}
              className="flex-shrink-0 text-[#c8c5bc] hover:text-[#ff6b6c] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Last sync status */}
      {(config?.lastSyncedAt || config?.lastSyncError) && (
        <div
          className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs border ${
            config.lastSyncError
              ? "bg-red-50 border-red-200 text-[#ff6b6c]"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {config.lastSyncError ? (
            <>
              <XCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>Last sync error: {config.lastSyncError}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Last synced:{" "}
                {config.lastSyncedAt ? new Date(config.lastSyncedAt).toLocaleString() : "—"}
              </span>
            </>
          )}
        </div>
      )}

      {syncResult && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          {syncResult}
        </div>
      )}

      {message && (
        <div
          className={`px-3 py-2 rounded-lg text-xs font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-[#ff6b6c] border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Creative preview */}
      <MetaCreativesPreview clientId={clientId} enabled={enabled} />

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] h-8 text-xs"
        >
          <Save className="h-3.5 w-3.5 mr-1" />
          {isSaving ? "Saving…" : "Save Configuration"}
        </Button>

        {config?.enabled && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isPending}
            className="border-[#e2e0d9] h-8 text-xs text-[#464540]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing…" : "Sync Now"}
          </Button>
        )}
      </div>
    </div>
  );
}
