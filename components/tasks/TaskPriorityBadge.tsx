const config: Record<string, { label: string; className: string }> = {
  LOW: {
    label: "Low",
    className: "bg-[#f0efe9] text-[#8a8880] border border-[#e2e0d9]",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  HIGH: {
    label: "High",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  URGENT: {
    label: "Urgent",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
};

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const { label, className } = config[priority] ?? config.MEDIUM;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
