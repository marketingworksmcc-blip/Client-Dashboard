const config: Record<string, { label: string; className: string }> = {
  TODO: {
    label: "To Do",
    className: "bg-[#f0efe9] text-[#8a8880] border border-[#e2e0d9]",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  NEEDS_INPUT: {
    label: "Needs Your Input",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-[#f0efe9] text-[#8a8880] border border-[#e2e0d9]",
  },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const { label, className } = config[status] ?? config.TODO;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
