import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Global portal configuration." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-[#464540]">
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#8a8880]">
            Global settings will be configured here in a later phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
