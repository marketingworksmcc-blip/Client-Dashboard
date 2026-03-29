import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Building2, ImageIcon, CheckSquare, Users, Activity } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <div>
      <PageHeader
        title={`Good morning, ${session?.user.name.split(" ")[0]}`}
        subtitle="Here's what's happening across your client portals."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Active Clients"
          value="—"
          subtitle="Across all portals"
          icon={Building2}
          iconBg="bg-[#263a2e]/10"
          iconColor="text-[#263a2e]"
        />
        <SummaryCard
          title="Pending Proofs"
          value="—"
          subtitle="Awaiting client review"
          icon={ImageIcon}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <SummaryCard
          title="Open Tasks"
          value="—"
          subtitle="Due this week"
          icon={CheckSquare}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          title="Portal Users"
          value="—"
          subtitle="Active client accounts"
          icon={Users}
          iconBg="bg-[#d3de2c]/20"
          iconColor="text-[#464540]"
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
              description="Activity across all client portals will appear here."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={CheckSquare}
              title="No upcoming deadlines"
              description="Proof due dates and task deadlines will appear here."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
