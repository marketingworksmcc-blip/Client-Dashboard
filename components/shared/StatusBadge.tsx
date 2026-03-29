import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProofStatus, TaskStatus, DocumentStatus, Priority } from "@prisma/client";

type AnyStatus = ProofStatus | TaskStatus | DocumentStatus | Priority;

const statusConfig: Record<string, { label: string; className: string }> = {
  // Proof statuses
  PENDING_REVIEW: {
    label: "Pending Review",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  IN_REVIEW: {
    label: "In Review",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-gray-50 text-gray-500 border-gray-200",
  },
  // Task statuses
  TODO: {
    label: "To Do",
    className: "bg-slate-50 text-slate-600 border-slate-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  NEEDS_INPUT: {
    label: "Needs Input",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  // Document statuses
  REQUIRES_REVIEW: {
    label: "Requires Review",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  REQUIRES_SIGNATURE: {
    label: "Requires Signature",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  REFERENCE: {
    label: "Reference",
    className: "bg-slate-50 text-slate-600 border-slate-200",
  },
  // Priority
  LOW: {
    label: "Low",
    className: "bg-slate-50 text-slate-500 border-slate-200",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-blue-50 text-blue-600 border-blue-200",
  },
  HIGH: {
    label: "High",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  URGENT: {
    label: "Urgent",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-gray-50 text-gray-600 border-gray-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium border", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
