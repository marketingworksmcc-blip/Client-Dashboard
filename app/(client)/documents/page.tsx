import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function ClientDocumentsPage() {
  return (
    <div>
      <PageHeader title="Documents" subtitle="Important files and documents from Revel." />
      <Card className="border-[#e2e0d9] shadow-none">
        <CardContent className="p-0">
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Documents shared by your Revel team will appear here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
