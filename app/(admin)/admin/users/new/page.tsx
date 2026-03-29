import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NewUserForm } from "@/components/admin/UserForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewUserPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;

  const clients = await prisma.client.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <PageHeader title="New User" subtitle="Create a portal account.">
        <Button variant="outline" asChild className="text-sm border-[#e2e0d9]">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              Revel team roles access the admin portal. Client roles access the client portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NewUserForm clients={clients} defaultClientId={clientId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
