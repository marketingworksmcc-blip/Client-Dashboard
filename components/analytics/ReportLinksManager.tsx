"use client";

import { useActionState, useTransition } from "react";
import { createReport, deleteReport } from "@/lib/actions/analytics";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/shared/SubmitButton";
import { ExternalLink, Trash2, Link2 } from "lucide-react";

type State = { error?: string; success?: boolean } | null;

interface ReportLink {
  id: string;
  title: string;
  reportUrl: string | null;
}

interface ReportLinksManagerProps {
  clientId: string;
  links: ReportLink[];
}

function DeleteLinkButton({ reportId }: { reportId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => deleteReport(reportId))}
      className="text-[#8a8880] hover:text-[#ff6b6c] transition-colors disabled:opacity-40"
      aria-label="Remove link"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export function ReportLinksManager({ clientId, links }: ReportLinksManagerProps) {
  const boundAction = createReport.bind(null, clientId);
  const [state, formAction] = useActionState<State, FormData>(
    boundAction as unknown as (state: State, formData: FormData) => Promise<State>,
    null
  );

  return (
    <div className="space-y-4">
      {/* Existing links */}
      {links.length > 0 && (
        <div className="divide-y divide-[#f0efe9] border border-[#e2e0d9] rounded-xl overflow-hidden">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-3 bg-white px-4 py-3">
              <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Link2 className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#464540] truncate">{link.title}</p>
                {link.reportUrl && (
                  <p className="text-xs text-[#8a8880] truncate">{link.reportUrl}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {link.reportUrl && (
                  <a
                    href={link.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8a8880] hover:text-[#464540] transition-colors"
                    title="Open link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <DeleteLinkButton reportId={link.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add link form */}
      <form
        action={async (fd) => {
          fd.append("reportType", "EXTERNAL_LINK");
          await formAction(fd);
        }}
        key={state?.success ? Date.now() : "link-form"}
        className="space-y-3"
      >
        {state?.error && <p className="text-xs text-[#ff6b6c]">{state.error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input
              name="title"
              placeholder="e.g. Looker Studio Report"
              required
              className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL</Label>
            <Input
              name="reportUrl"
              type="url"
              placeholder="https://lookerstudio.google.com/…"
              required
              className="border-[#e2e0d9] focus-visible:ring-[#d3de2c] h-8 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <SubmitButton
            label="Add Link"
            loadingLabel="Adding…"
            className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1] text-xs h-8 px-3"
          />
        </div>
      </form>
    </div>
  );
}
