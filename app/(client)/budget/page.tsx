import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign } from "lucide-react";

export default async function ClientBudgetPage() {
  const session = await auth();
  const clientId = session!.user.clientIds?.[0];

  const budget = clientId
    ? await prisma.budget.findFirst({
        where: { clientId },
        orderBy: { createdAt: "desc" },
        include: { lineItems: { orderBy: { date: "desc" } } },
      })
    : null;

  const spent = budget
    ? budget.lineItems.reduce((sum, item) => sum + Number(item.amount), 0)
    : 0;

  return (
    <div>
      <PageHeader title="Budget" subtitle="Your campaign budget and spend overview." />

      {!budget ? (
        <EmptyState
          icon={DollarSign}
          title="No budget set up yet"
          description="Your Revel team will set up your budget tracker here."
        />
      ) : (
        <div className="space-y-5">
          <Card className="border-[#e2e0d9]">
            <CardContent className="p-6">
              <BudgetOverview
                name={budget.name}
                period={budget.period}
                totalAmount={Number(budget.totalAmount)}
                spent={spent}
              />
            </CardContent>
          </Card>

          {budget.lineItems.length > 0 && (
            <Card className="border-[#e2e0d9]">
              <CardHeader className="pb-3">
                <CardTitle>Spend Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-[#f0efe9]">
                  {budget.lineItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#464540]">{item.category}</p>
                        {item.description && (
                          <p className="text-xs text-[#8a8880]">{item.description}</p>
                        )}
                      </div>
                      {item.date && (
                        <span className="text-xs text-[#8a8880] flex-shrink-0">{formatDate(item.date)}</span>
                      )}
                      <span className="text-sm font-medium text-[#464540] flex-shrink-0 w-20 text-right">
                        {formatCurrency(Number(item.amount))}
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between px-5 py-3 bg-[#f0efe9]/50">
                    <span className="text-xs font-medium text-[#8a8880]">Total Spent</span>
                    <span className="text-sm font-semibold text-[#464540]">{formatCurrency(spent)}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
