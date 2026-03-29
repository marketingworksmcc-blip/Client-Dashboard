import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ImageIcon,
  DollarSign,
  CheckSquare,
  FileText,
  Activity,
  Calendar,
} from "lucide-react";

export default async function ClientDashboardPage() {
  const session = await auth();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${session?.user.name.split(" ")[0]}`}
        subtitle="Here's a summary of your portal activity."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Pending Reviews"
          value="—"
          subtitle="Proofs awaiting your review"
          icon={ImageIcon}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <SummaryCard
          title="Budget Spent"
          value="—"
          subtitle="This period"
          icon={DollarSign}
          iconBg="bg-[#263a2e]/10"
          iconColor="text-[#263a2e]"
        />
        <SummaryCard
          title="Active Tasks"
          value="—"
          subtitle="Assigned to you"
          icon={CheckSquare}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="Docs to Review"
          value="—"
          subtitle="Requiring action"
          icon={FileText}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Activity}
              title="No recent activity"
              description="Your portal activity will appear here."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Calendar}
              title="No upcoming deadlines"
              description="Due dates for proofs and tasks will appear here."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
