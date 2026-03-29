import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function ClientAnalyticsTab() {
  return (
    <Card>
      <CardContent className="p-0">
        <EmptyState
          icon={BarChart2}
          title="Analytics — coming in Phase 6"
          description="Configure analytics reports and metrics for this client."
        />
      </CardContent>
    </Card>
  );
}
