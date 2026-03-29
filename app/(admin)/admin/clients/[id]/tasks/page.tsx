import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export default function ClientTasksTab() {
  return (
    <Card>
      <CardContent className="p-0">
        <EmptyState
          icon={CheckSquare}
          title="Tasks — coming in Phase 5"
          description="Create and assign tasks for this client."
        />
      </CardContent>
    </Card>
  );
}
