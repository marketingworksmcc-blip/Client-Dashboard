import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function ClientBudgetPage() {
  return (
    <div>
      <PageHeader title="Budget" subtitle="Your campaign budget and spend overview." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardContent className="p-0">
          <EmptyState
            icon={DollarSign}
            title="No budget data yet"
            description="Your Revel team will set up your budget tracker here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
