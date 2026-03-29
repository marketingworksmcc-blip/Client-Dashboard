import { formatRelativeTime } from "@/lib/utils";
import { ImageIcon, CheckSquare, FileText, DollarSign, Building2, User, Activity } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityTitle: string | null;
  createdAt: Date;
  user: { name: string };
};

const entityIcons: Record<string, React.ElementType> = {
  Proof: ImageIcon,
  Task: CheckSquare,
  Document: FileText,
  Budget: DollarSign,
  Client: Building2,
  User: User,
};

const entityColors: Record<string, string> = {
  Proof: "bg-amber-50 text-amber-600",
  Task: "bg-blue-50 text-blue-600",
  Document: "bg-purple-50 text-purple-600",
  Budget: "bg-[#263a2e]/10 text-[#263a2e]",
  Client: "bg-emerald-50 text-emerald-600",
  User: "bg-gray-50 text-gray-500",
};

function formatAction(action: string, entityType: string, entityTitle: string | null): string {
  const title = entityTitle ? `"${entityTitle}"` : entityType.toLowerCase();
  const actionMap: Record<string, string> = {
    created: `Created ${title}`,
    updated: `Updated ${title}`,
    approved: `Approved ${title}`,
    rejected: `Requested changes on ${title}`,
    commented: `Commented on ${title}`,
    uploaded: `Uploaded ${title}`,
    completed: `Completed ${title}`,
    archived: `Archived ${title}`,
    assigned: `Assigned ${title}`,
  };
  return actionMap[action] ?? `${action} ${title}`;
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No recent activity"
        description="Your portal activity will appear here."
      />
    );
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = entityIcons[item.entityType] ?? Activity;
        const colorClass = entityColors[item.entityType] ?? "bg-[#f0efe9] text-[#8a8880]";

        return (
          <li key={item.id} className="flex items-start gap-3 py-2.5 border-b border-[#f0efe9] last:border-0">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${colorClass}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#464540] leading-snug">
                <span className="font-medium">{item.user.name}</span>
                {" "}
                {formatAction(item.action, item.entityType, item.entityTitle)}
              </p>
              <p className="text-xs text-[#8a8880] mt-0.5">{formatRelativeTime(item.createdAt)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
