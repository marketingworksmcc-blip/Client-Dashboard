import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export default function AdminTasksPage() {
  return (
    <div>
      <PageHeader title="Tasks" subtitle="Manage tasks assigned to clients." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardContent className="p-0">
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Create and assign tasks to clients. Coming in Phase 5."
          />
        </CardContent>
      </Card>
    </div>
  );
}
