import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export default function ClientTasksPage() {
  return (
    <div>
      <PageHeader title="Tasks" subtitle="Items that need your attention." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardContent className="p-0">
          <EmptyState
            icon={CheckSquare}
            title="No tasks assigned"
            description="Tasks assigned to you by your Revel team will appear here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
