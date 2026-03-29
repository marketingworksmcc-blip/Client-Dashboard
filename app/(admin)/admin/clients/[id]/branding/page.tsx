import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UpdateBrandingForm } from "@/components/admin/UpdateBrandingForm";
import { BrandingPreview } from "@/components/admin/BrandingPreview";

export default async function ClientBrandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: { brandSettings: true },
  });

  if (!client) notFound();

  const b = client.brandSettings;

  const defaults = {
    portalName: b?.portalName ?? client.name,
    portalSubtitle: b?.portalSubtitle ?? "",
    logoUrl: b?.logoUrl ?? "",
    primaryColor: b?.primaryColor ?? "#d3de2c",
    secondaryColor: b?.secondaryColor ?? "#263a2e",
    backgroundStyle: b?.backgroundStyle ?? "default",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Portal Branding</CardTitle>
          <CardDescription>
            Customize how this client's portal looks and feels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateBrandingForm clientId={id} defaults={defaults} />
        </CardContent>
      </Card>

      <BrandingPreview
        portalName={defaults.portalName}
        portalSubtitle={defaults.portalSubtitle}
        primaryColor={defaults.primaryColor}
        secondaryColor={defaults.secondaryColor}
      />
    </div>
  );
}
