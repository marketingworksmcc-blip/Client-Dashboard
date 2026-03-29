import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function ClientBudgetTab() {
  return (
    <Card>
      <CardContent className="p-0">
        <EmptyState
          icon={DollarSign}
          title="Budget — coming in Phase 6"
          description="Set up and manage the budget tracker for this client."
        />
      </CardContent>
    </Card>
  );
}
