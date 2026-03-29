import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function AdminDocumentsPage() {
  return (
    <div>
      <PageHeader title="Documents" subtitle="Manage client documents and files." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardContent className="p-0">
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload and manage documents for clients. Coming in Phase 5."
          />
        </CardContent>
      </Card>
    </div>
  );
}
