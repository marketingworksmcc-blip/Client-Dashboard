import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function AdminAnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Manage analytics reports and metrics." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardContent className="p-0">
          <EmptyState
            icon={BarChart2}
            title="No analytics configured"
            description="Add report links or manual metrics for clients. Coming in Phase 6."
          />
        </CardContent>
      </Card>
    </div>
  );
}
