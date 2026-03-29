import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewProofForm } from "@/components/proofs/NewProofForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewProofPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  return (
    <div>
      <PageHeader title="New Proof" subtitle={`Uploading for ${client.name}`}>
        <Button variant="outline" asChild className="border-[#e2e0d9]">
          <Link href={`/admin/clients/${id}/proofs`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Card className="max-w-2xl border-[#e2e0d9]">
        <CardHeader className="pb-4">
          <CardTitle>Proof Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NewProofForm clientId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
