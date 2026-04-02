"use client";

import { useState, useTransition } from "react";
import {
  saveGoogleAdsConfig,
  testGoogleAdsConnection,
  syncGoogleAds,
  type GoogleAdsMetricMapping,
} from "@/lib/actions/googleAds";
import { GOOGLE_ADS_METRICS } from "@/lib/google-ads-metrics";
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
  customerId: string;
  developerToken: string;
  serviceAccountJson: string;
  mappings: GoogleAdsMetricMapping[];
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
}

interface Props {
  clientId: string;
  metrics: MetricOption[];
  config: ExistingConfig | null;
}

export function GoogleAdsConfigForm({ clientId, metrics, config }: Props) {
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [customerId, setCustomerId] = useState(config?.customerId ?? "");
  const [developerToken, setDeveloperToken] = useState(config?.developerToken ?? "");
  const [serviceAccountJson, setServiceAccountJson] = useState(config?.serviceAccountJson ?? "");
  const [mappings, setMappings] = useState<GoogleAdsMetricMapping[]>(
    config?.mappings?.length ? config.mappings : [{ adsMetric: "", metricId: "" }]
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
    setMappings((prev) => [...prev, { adsMetric: "", metricId: "" }]);
  }

  function removeMapping(index: number) {
    setMappings((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMapping(index: number, field: keyof GoogleAdsMetricMapping, value: string) {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function handleSave() {
    if (!customerId.trim()) { showMessage("error", "Customer ID is required."); return; }
    if (!developerToken.trim()) { showMessage("error", "Developer token is required."); return; }
    if (!serviceAccountJson.trim()) { showMessage("error", "Service account JSON is required."); return; }
    startSave(async () => {
      try {
        await saveGoogleAdsConfig(clientId, {
          enabled,
          customerId,
          developerToken,
          serviceAccountJson,
          mappings: mappings.filter((m) => m.adsMetric && m.metricId),
        });
        showMessage("success", "Google Ads configuration saved.");
      } catch {
        showMessage("error", "Failed to save configuration.");
      }
    });
  }

  function handleTest() {
    if (!customerId.trim() || !developerToken.trim() || !serviceAccountJson.trim()) {
      showMessage("error", "Fill in Customer ID, developer token, and service account JSON first.");
      return;
    }
    setTestStatus("idle");
    setTestAccountName(null);
    setSyncResult(null);
    startTest(async () => {
      try {
        const result = await testGoogleAdsConnection(customerId, developerToken, serviceAccountJson);
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
        const result = await syncGoogleAds(clientId);
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
          <p className="text-sm font-medium text-[#464540]">Enable Google Ads Sync</p>
          <p className="text-xs text-[#8a8880] mt-0.5">
            Pull Google Ads campaign metrics into client dashboards
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

      {/* Customer ID */}
      <div className="space-y-1.5">
        <Label htmlFor="gads-customer-id" className="text-xs font-medium text-[#464540]">
          Customer ID
        </Label>
        <Input
          id="gads-customer-id"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="123-456-7890"
          className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e]"
        />
        <p className="text-xs text-[#8a8880]">
          Found in Google Ads → top-right corner. Dashes are optional.
        </p>
      </div>

      {/* Developer token */}
      <div className="space-y-1.5">
        <Label htmlFor="gads-dev-token" className="text-xs font-medium text-[#464540]">
          Developer Token
        </Label>
        <Input
          id="gads-dev-token"
          type="password"
          value={developerToken}
          onChange={(e) => setDeveloperToken(e.target.value)}
          placeholder="••••••••••••••••"
          className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e]"
        />
        <p className="text-xs text-[#8a8880]">
          From Google Ads → Tools → API Center. Requires applying for API access.
        </p>
      </div>

      {/* Service account JSON */}
      <div className="space-y-1.5">
        <Label htmlFor="gads-sa-json" className="text-xs font-medium text-[#464540]">
          Service Account JSON Key
        </Label>
        <textarea
          id="gads-sa-json"
          value={serviceAccountJson}
          onChange={(e) => setServiceAccountJson(e.target.value)}
          placeholder={'{\n  "type": "service_account",\n  "client_email": "...",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n..."\n}'}
          rows={6}
          className="w-full rounded-md border border-[#e2e0d9] bg-white px-3 py-2 text-xs font-mono text-[#464540] focus:outline-none focus:ring-1 focus:ring-[#263a2e] resize-none"
        />
        <p className="text-xs text-[#8a8880]">
          The service account must be added as a user in Google Ads with at least Read Only access
          (Google Ads → Admin → Access and security).
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
          Map Google Ads metrics to your client dashboard metrics.
        </p>

        {mappings.length === 0 && (
          <p className="text-xs text-[#8a8880] py-2">No mappings yet.</p>
        )}

        {mappings.map((mapping, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={mapping.adsMetric}
              onChange={(e) => updateMapping(index, "adsMetric", e.target.value)}
              className="h-8 flex-1 rounded-md border border-[#e2e0d9] bg-white px-2 text-xs text-[#464540] focus:outline-none focus:ring-1 focus:ring-[#263a2e]"
            >
              <option value="">Google Ads metric…</option>
              {GOOGLE_ADS_METRICS.map((m) => (
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
