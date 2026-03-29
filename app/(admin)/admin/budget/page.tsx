import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function AdminBudgetPage() {
  return (
    <div>
      <PageHeader title="Budget" subtitle="Manage client budgets and spend tracking." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardContent className="p-0">
          <EmptyState
            icon={DollarSign}
            title="No budgets configured"
            description="Set up budget tracking for clients. Coming in Phase 6."
          />
        </CardContent>
      </Card>
    </div>
  );
}
