const config: Record<string, { label: string; className: string }> = {
  REQUIRES_REVIEW: {
    label: "Needs Review",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  REQUIRES_SIGNATURE: {
    label: "Needs Signature",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  REFERENCE: {
    label: "Reference",
    className: "bg-[#f0efe9] text-[#8a8880] border border-[#e2e0d9]",
  },
};

export function DocumentStatusBadge({ status }: { status: string }) {
  const { label, className } = config[status] ?? config.REFERENCE;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
