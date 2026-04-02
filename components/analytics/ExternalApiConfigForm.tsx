"use client";

import { useState, useTransition } from "react";
import {
  saveExternalApiConfig,
  testExternalApiConnection,
  syncExternalApi,
  type ApiFieldMapping,
} from "@/lib/actions/externalMetricApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Play, RefreshCw, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { ExternalApiAuthType } from "@prisma/client";

interface MetricOption {
  id: string;
  name: string;
}

interface ExistingConfig {
  enabled: boolean;
  apiUrl: string;
  authType: ExternalApiAuthType;
  apiKey?: string | null;
  headerName?: string | null;
  mappings: ApiFieldMapping[];
  lastSyncedAt?: string | null;
  lastSyncError?: string | null;
}

interface Props {
  clientId: string;
  metrics: MetricOption[];
  config: ExistingConfig | null;
}

export function ExternalApiConfigForm({ clientId, metrics, config }: Props) {
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [apiUrl, setApiUrl] = useState(config?.apiUrl ?? "");
  const [authType, setAuthType] = useState<ExternalApiAuthType>(config?.authType ?? "NONE");
  const [apiKey, setApiKey] = useState(config?.apiKey ?? "");
  const [headerName, setHeaderName] = useState(config?.headerName ?? "X-API-Key");
  const [mappings, setMappings] = useState<ApiFieldMapping[]>(
    config?.mappings?.length ? config.mappings : [{ apiField: "", metricId: "" }]
  );
  const [previewJson, setPreviewJson] = useState<string | null>(null);
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
    setMappings((prev) => [...prev, { apiField: "", metricId: "" }]);
  }

  function removeMapping(index: number) {
    setMappings((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMapping(index: number, field: keyof ApiFieldMapping, value: string) {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function handleSave() {
    if (!apiUrl.trim()) {
      showMessage("error", "API URL is required.");
      return;
    }
    startSave(async () => {
      try {
        await saveExternalApiConfig(clientId, {
          enabled,
          apiUrl: apiUrl.trim(),
          authType,
          apiKey: apiKey || undefined,
          headerName: headerName || undefined,
          mappings: mappings.filter((m) => m.apiField && m.metricId),
        });
        showMessage("success", "Configuration saved.");
      } catch {
        showMessage("error", "Failed to save configuration.");
      }
    });
  }

  function handleTest() {
    if (!apiUrl.trim()) {
      showMessage("error", "Enter an API URL first.");
      return;
    }
    setPreviewJson(null);
    setSyncResult(null);
    startTest(async () => {
      try {
        const result = await testExternalApiConnection(
          apiUrl.trim(),
          authType,
          apiKey || undefined,
          headerName || undefined
        );
        if (result.ok) {
          setPreviewJson(JSON.stringify(result.preview, null, 2));
        } else {
          showMessage("error", `Connection failed: ${result.error}`);
        }
      } catch {
        showMessage("error", "Test failed unexpectedly.");
      }
    });
  }

  function handleSync() {
    setSyncResult(null);
    startSync(async () => {
      try {
        const result = await syncExternalApi(clientId);
        if (result.ok) {
          setSyncResult(`Synced ${result.synced} metric${result.synced !== 1 ? "s" : ""} for today.`);
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
          <p className="text-sm font-medium text-[#464540]">Enable External API Sync</p>
          <p className="text-xs text-[#8a8880] mt-0.5">
            Pull metric values automatically from an external API
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

      {/* API URL */}
      <div className="space-y-1.5">
        <Label htmlFor="ext-api-url" className="text-xs font-medium text-[#464540]">
          API Endpoint URL
        </Label>
        <Input
          id="ext-api-url"
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="https://api.example.com/metrics"
          className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e]"
        />
      </div>

      {/* Auth type */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#464540]">Authentication</Label>
        <div className="flex gap-2">
          {(["NONE", "BEARER", "API_KEY_HEADER"] as ExternalApiAuthType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAuthType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                authType === type
                  ? "bg-[#263a2e] text-white border-[#263a2e]"
                  : "bg-white text-[#464540] border-[#e2e0d9] hover:border-[#c8c5bc]"
              }`}
            >
              {type === "NONE" ? "None" : type === "BEARER" ? "Bearer Token" : "API Key Header"}
            </button>
          ))}
        </div>
      </div>

      {/* Credentials */}
      {authType !== "NONE" && (
        <div className="space-y-3 pl-3 border-l-2 border-[#f0efe9]">
          {authType === "API_KEY_HEADER" && (
            <div className="space-y-1.5">
              <Label htmlFor="ext-header-name" className="text-xs font-medium text-[#464540]">
                Header Name
              </Label>
              <Input
                id="ext-header-name"
                value={headerName}
                onChange={(e) => setHeaderName(e.target.value)}
                placeholder="X-API-Key"
                className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e]"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="ext-api-key" className="text-xs font-medium text-[#464540]">
              {authType === "BEARER" ? "Bearer Token" : "API Key Value"}
            </Label>
            <Input
              id="ext-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="••••••••••••••••"
              className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e]"
            />
          </div>
        </div>
      )}

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
        {previewJson && (
          <span className="flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Connected — response preview below
          </span>
        )}
      </div>

      {/* JSON preview */}
      {previewJson && (
        <div className="rounded-lg border border-[#e2e0d9] bg-[#f9f8f5] p-3 overflow-auto max-h-40">
          <pre className="text-xs text-[#464540] whitespace-pre-wrap">{previewJson}</pre>
        </div>
      )}

      {/* Field mappings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-[#464540]">Field Mappings</Label>
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
          Map JSON fields from the API response to your client metrics. Use dot-notation for nested
          fields (e.g. <span className="font-mono">data.sessions</span>).
        </p>

        {mappings.length === 0 && (
          <p className="text-xs text-[#8a8880] py-2">No mappings yet. Click &quot;Add mapping&quot; to start.</p>
        )}

        {mappings.map((mapping, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={mapping.apiField}
              onChange={(e) => updateMapping(index, "apiField", e.target.value)}
              placeholder="JSON field path (e.g. data.sessions)"
              className="h-8 text-xs border-[#e2e0d9] focus-visible:ring-[#263a2e]"
            />
            <span className="text-xs text-[#8a8880] flex-shrink-0">→</span>
            <select
              value={mapping.metricId}
              onChange={(e) => updateMapping(index, "metricId", e.target.value)}
              className="h-8 flex-1 rounded-md border border-[#e2e0d9] bg-white px-2 text-xs text-[#464540] focus:outline-none focus:ring-1 focus:ring-[#263a2e]"
            >
              <option value="">Select metric…</option>
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

      {/* Status info */}
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
                {config.lastSyncedAt
                  ? new Date(config.lastSyncedAt).toLocaleString()
                  : "—"}
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
