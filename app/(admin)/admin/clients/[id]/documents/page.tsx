import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ClientDocumentsTab() {
  return (
    <Card>
      <CardContent className="p-0">
        <EmptyState
          icon={FileText}
          title="Documents — coming in Phase 5"
          description="Upload and manage documents for this client."
        />
      </CardContent>
    </Card>
  );
}
