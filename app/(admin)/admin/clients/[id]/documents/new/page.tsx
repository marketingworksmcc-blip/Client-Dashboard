import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewDocumentForm } from "@/components/documents/NewDocumentForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div>
      <PageHeader title="Upload Document" subtitle={`Uploading for ${client.name}`}>
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href={`/admin/clients/${id}/documents`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl border-[#e2e0d9]">
        <CardHeader className="pb-4">
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewDocumentForm clientId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
