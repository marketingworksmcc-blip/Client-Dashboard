import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BudgetOverview } from "@/components/budget/BudgetOverview";
import { AddLineItemForm } from "@/components/budget/AddLineItemForm";
import { LineItemRow } from "@/components/budget/LineItemRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { createBudget, deleteBudget } from "@/lib/actions/budget";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function ClientBudgetTab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  const budgets = await prisma.budget.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
    include: { lineItems: { orderBy: { createdAt: "desc" } } },
  });

  const activeBudget = budgets[0] ?? null;
  const spent = activeBudget
    ? activeBudget.lineItems.reduce((sum, item) => sum + Number(item.amount), 0)
    : 0;

  const deleteBudgetWithId = activeBudget ? deleteBudget.bind(null, activeBudget.id) : null;

  return (
    <div className="space-y-5">
      {!activeBudget ? (
        <Card className="border-[#e2e0d9]">
          <CardHeader className="pb-3">
            <CardTitle>Set Up Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createBudget.bind(null, id)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#464540]">Budget Name</label>
                  <input name="name" placeholder="e.g. Q1 2025 Campaign" required
                    className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#464540]">Total Budget ($)</label>
                  <input name="totalAmount" type="number" min="0.01" step="0.01" placeholder="0.00" required
                    className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#464540]">Period <span className="text-[#8a8880] font-normal">(optional)</span></label>
                <input name="period" placeholder="e.g. January – March 2025"
                  className="w-full rounded-lg border border-[#e2e0d9] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d3de2c]" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" className="bg-[#263a2e] hover:bg-[#1e2e24] text-[#ece9e1]">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create Budget
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview */}
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Budget Overview</CardTitle>
                {deleteBudgetWithId && (
                  <form action={deleteBudgetWithId}>
                    <Button type="submit" variant="ghost" size="sm"
                      className="text-[#8a8880] hover:text-[#ff6b6c] hover:bg-[#ff6b6c]/5 h-7 px-2 text-xs">
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete Budget
                    </Button>
                  </form>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <BudgetOverview
                name={activeBudget.name}
                period={activeBudget.period}
                totalAmount={Number(activeBudget.totalAmount)}
                spent={spent}
              />
            </CardContent>
          </Card>

          {/* Line items */}
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {activeBudget.lineItems.length === 0 ? (
                <div className="px-5 py-4 text-sm text-[#8a8880]">No line items yet.</div>
              ) : (
                <ul className="divide-y divide-[#f0efe9]">
                  {activeBudget.lineItems.map((item) => (
                    <LineItemRow key={item.id} item={{ ...item, amount: Number(item.amount) }} />
                  ))}
                  <li className="flex items-center justify-between px-5 py-3 bg-[#f0efe9]/50">
                    <span className="text-xs font-medium text-[#8a8880]">Total Spent</span>
                    <span className="text-sm font-semibold text-[#464540]">{formatCurrency(spent)}</span>
                  </li>
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Add line item */}
          <Card className="border-[#e2e0d9]">
            <CardHeader className="pb-3">
              <CardTitle>Add Line Item</CardTitle>
            </CardHeader>
            <CardContent>
              <AddLineItemForm budgetId={activeBudget.id} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
