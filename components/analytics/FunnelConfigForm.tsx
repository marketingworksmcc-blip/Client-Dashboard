"use client";

import { useState, useTransition } from "react";
import {
  saveFunnelConfig,
  testFunnelConnection,
  syncFunnel,
  type FunnelMetricMapping,
} from "@/lib/actions/funnel";
import { FUNNEL_METRICS } from "@/lib/funnel-metrics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Play, RefreshCw, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";

interface MetricOption {
  id: string;
  name: string;
}

interface ExistingConfig {
  enabled: boolean;
  apiKey: string;
  accountId: string;
  mappings: FunnelMetricMapping[];
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
}

interface Props {
  clientId: string;
  metrics: MetricOption[];
  config: ExistingConfig | null;
}

export function FunnelConfigForm({ clientId, metrics, config }: Props) {
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [apiKey, setApiKey] = useState(config?.apiKey ?? "");
  const [accountId, setAccountId] = useState(config?.accountId ?? "");
  const [mappings, setMappings] = useState<FunnelMetricMapping[]>(
    config?.mappings?.length ? config.mappings : [{ funnelMetric: "", metricId: "" }]
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
    setMappings((prev) => [...prev, { funnelMetric: "", metricId: "" }]);
  }

  function removeMapping(index: number) {
    setMappings((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMapping(index: number, field: keyof FunnelMetricMapping, value: string) {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function handleSave() {
    if (!apiKey.trim()) { showMessage("error", "API key is required."); return; }
    if (!accountId.trim()) { showMessage("error", "Account ID is required."); return; }
    startSave(async () => {
      try {
        await saveFunnelConfig(clientId, {
          enabled,
          apiKey,
          accountId,
          mappings: mappings.filter((m) => m.funnelMetric && m.metricId),
        });
        showMessage("success", "Funnel.io configuration saved.");
      } catch {
        showMessage("error", "Failed to save configuration.");
      }
    });
  }

  function handleTest() {
    if (!apiKey.trim() || !accountId.trim()) {
      showMessage("error", "Fill in API key and Account ID first.");
      return;
    }
    setTestStatus("idle");
    setTestAccountName(null);
    setSyncResult(null);
    startTest(async () => {
      try {
        const result = await testFunnelConnection(apiKey, accountId);
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
        const result = await syncFunnel(clientId);
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
          <p className="text-sm font-medium text-[#464540]">Enable Funnel.io Sync</p>
          <p className="text-xs text-[#8a8880] mt-0.5">
            Pull Funnel.io marketing data into client dashboards
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

      {/* API Key */}
      <div className="space-y-1.5">
        <Label htmlFor="funnel-api-key" className="text-xs font-medium text-[#464540]">
          API Key
        </Label>
        <Input
          id="funnel-api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="••••••••••••••••"
          className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e]"
        />
        <p className="text-xs text-[#8a8880]">
          Found in Funnel.io → Settings → API Keys.
        </p>
      </div>

      {/* Account ID */}
      <div className="space-y-1.5">
        <Label htmlFor="funnel-account-id" className="text-xs font-medium text-[#464540]">
          Account ID
        </Label>
        <Input
          id="funnel-account-id"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="your-account-id"
          className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e]"
        />
        <p className="text-xs text-[#8a8880]">
          Found in Funnel.io → Settings → Account. This is the account/organization identifier.
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
          Map Funnel.io metrics to your client dashboard metrics.
        </p>

        {mappings.length === 0 && (
          <p className="text-xs text-[#8a8880] py-2">No mappings yet.</p>
        )}

        {mappings.map((mapping, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={mapping.funnelMetric}
              onChange={(e) => updateMapping(index, "funnelMetric", e.target.value)}
              className="h-8 flex-1 rounded-md border border-[#e2e0d9] bg-white px-2 text-xs text-[#464540] focus:outline-none focus:ring-1 focus:ring-[#263a2e]"
            >
              <option value="">Funnel.io metric…</option>
              {FUNNEL_METRICS.map((m) => (
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
