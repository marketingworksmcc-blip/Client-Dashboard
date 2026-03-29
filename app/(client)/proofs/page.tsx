import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

export default function ClientProofsPage() {
  return (
    <div>
      <PageHeader title="Proofs" subtitle="Review and approve creative work from Revel." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardContent className="p-0">
          <EmptyState
            icon={ImageIcon}
            title="No proofs yet"
            description="Creative proofs from your Revel team will appear here for review."
          />
        </CardContent>
      </Card>
    </div>
  );
}
