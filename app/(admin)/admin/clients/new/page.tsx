import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NewClientForm } from "@/components/admin/ClientForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewClientPage() {
  return (
    <div>
      <PageHeader title="New Client" subtitle="Create a new client portal.">
        <Button variant="outline" asChild className="text-sm border-[#e2e0d9]">
          <Link href="/admin/clients">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
            <CardDescription>
              Basic info for the new client portal. You can configure branding after creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewClientForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
