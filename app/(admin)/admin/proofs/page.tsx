import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

export default function AdminProofsPage() {
  return (
    <div>
      <PageHeader title="Proofs" subtitle="Manage creative proofs across all clients." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardContent className="p-0">
          <EmptyState
            icon={ImageIcon}
            title="No proofs yet"
            description="Upload proofs and assign them to clients. Coming in Phase 4."
          />
        </CardContent>
      </Card>
    </div>
  );
}
