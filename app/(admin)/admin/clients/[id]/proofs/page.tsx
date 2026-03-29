import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";

export default function ClientProofsTab() {
  return (
    <Card>
      <CardContent className="p-0">
        <EmptyState
          icon={ImageIcon}
          title="Proofs — coming in Phase 4"
          description="Upload and manage creative proofs for this client."
        />
      </CardContent>
    </Card>
  );
}
