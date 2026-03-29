import { cn } from "@/lib/utils";
import type { ProofStatus } from "@prisma/client";

const config: Record<ProofStatus, { label: string; className: string }> = {
  PENDING_REVIEW: { label: "Pending Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  IN_REVIEW:      { label: "In Review",      className: "bg-blue-50 text-blue-700 border-blue-200" },
  APPROVED:       { label: "Approved",        className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CHANGES_REQUESTED: { label: "Changes Requested", className: "bg-[#ff6b6c]/10 text-[#ff6b6c] border-[#ff6b6c]/20" },
  ARCHIVED:       { label: "Archived",        className: "bg-gray-50 text-gray-500 border-gray-200" },
};

export function ProofStatusBadge({ status }: { status: ProofStatus }) {
  const { label, className } = config[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", className)}>
      {label}
    </span>
  );
}
