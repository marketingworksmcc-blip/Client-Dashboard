import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function ClientAnalyticsPage() {
  return (
    <div>
      <PageHeader title="Analytics" subtitle="Performance reports and metrics." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardContent className="p-0">
          <EmptyState
            icon={BarChart2}
            title="No analytics available"
            description="Your Revel team will share performance reports here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
