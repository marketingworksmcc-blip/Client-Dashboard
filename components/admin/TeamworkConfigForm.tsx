"use client";

import { useState, useTransition } from "react";
import { saveTeamworkConfig, deleteTeamworkConfig } from "@/lib/actions/teamwork";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Trash2, ExternalLink } from "lucide-react";

interface Props {
  clientId: string;
  config: {
    enabled: boolean;
    projectId: string;
    domain: string;
  } | null;
}

export function TeamworkConfigForm({ clientId, config }: Props) {
  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [projectId, setProjectId] = useState(config?.projectId ?? "");
  const [domain, setDomain] = useState(config?.domain ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function handleSave() {
    if (!projectId.trim() || !domain.trim()) {
      showMessage("error", "Project ID and domain are required.");
      return;
    }
    startTransition(async () => {
      try {
        await saveTeamworkConfig(clientId, {
          enabled,
          projectId: projectId.trim(),
          domain: domain.trim().replace(/^https?:\/\//, "").replace(/\/$/, ""),
        });
        showMessage("success", "Teamwork configuration saved.");
      } catch {
        showMessage("error", "Failed to save configuration.");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Remove Teamwork integration for this client?")) return;
    startTransition(async () => {
      try {
        await deleteTeamworkConfig(clientId);
        setEnabled(false);
        setProjectId("");
        setDomain("");
        showMessage("success", "Teamwork configuration removed.");
      } catch {
        showMessage("error", "Failed to remove configuration.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between py-3 border-b border-[#f0efe9]">
        <div>
          <p className="text-sm font-medium text-[#464540]">Enable Teamwork Integration</p>
          <p className="text-xs text-[#8a8880] mt-0.5">
            Show Teamwork project data in this client's portal
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

      {/* Domain */}
      <div className="space-y-1.5">
        <Label htmlFor="tw-domain" className="text-xs font-medium text-[#464540]">
          Teamwork Domain
        </Label>
        <Input
          id="tw-domain"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yourcompany.teamwork.com"
          className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e]"
        />
        <p className="text-xs text-[#8a8880]">Your Teamwork account domain (without https://)</p>
      </div>

      {/* Project ID */}
      <div className="space-y-1.5">
        <Label htmlFor="tw-project" className="text-xs font-medium text-[#464540]">
          Project ID
        </Label>
        <Input
          id="tw-project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="123456"
          className="h-9 text-sm border-[#e2e0d9] focus-visible:ring-[#263a2e]"
        />
        <p className="text-xs text-[#8a8880]">
          Found in the project URL:{" "}
          <span className="font-mono">yourcompany.teamwork.com/projects/</span>
          <span className="font-mono font-semibold text-[#464540]">123456</span>
          <span className="font-mono">/</span>
        </p>
      </div>

      {/* Message */}
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
          {isPending ? "Saving…" : "Save Configuration"}
        </Button>

        {domain && projectId && (
          <Button
            size="sm"
            variant="outline"
            asChild
            className="border-[#e2e0d9] h-8 text-xs text-[#464540]"
          >
            <a
              href={`https://${domain}/projects/${projectId}/`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Open in Teamwork
            </a>
          </Button>
        )}

        {config && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={isPending}
            className="border-[#ff6b6c]/30 text-[#ff6b6c] hover:bg-[#ff6b6c]/5 h-8 text-xs ml-auto"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
