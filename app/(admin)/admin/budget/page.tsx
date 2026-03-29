import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import Link from "next/link";

export default async function AdminBudgetPage() {
  const budgets = await prisma.budget.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      lineItems: { select: { amount: true } },
    },
  });

  return (
    <div>
      <PageHeader title="Budget" subtitle="Budget overview across all clients." />

      {budgets.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No budgets configured"
          description="Set up budget tracking from a client's detail page."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const spent = budget.lineItems.reduce((sum, item) => sum + Number(item.amount), 0);
            return (
              <Link key={budget.id} href={`/admin/clients/${budget.client.id}/budget`}>
                <Card className="border-[#e2e0d9] hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="p-5 space-y-3">
                    <p className="text-xs font-medium text-[#8a8880] uppercase tracking-wide">
                      {budget.client.name}
                    </p>
                    <BudgetOverview
                      name={budget.name}
                      period={budget.period}
                      totalAmount={Number(budget.totalAmount)}
                      spent={spent}
                    />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
