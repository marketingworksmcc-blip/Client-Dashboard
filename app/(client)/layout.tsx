import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isClientUser } from "@/lib/permissions";
import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { getClientBranding, REVEL_DEFAULTS } from "@/lib/branding";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!isClientUser(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const clientId = session.user.clientIds?.[0];
  const branding = clientId
    ? await getClientBranding(clientId)
    : {
        portalName: REVEL_DEFAULTS.portalName,
        portalSubtitle: REVEL_DEFAULTS.portalSubtitle,
        primaryColor: REVEL_DEFAULTS.primaryColor,
        secondaryColor: REVEL_DEFAULTS.secondaryColor,
        backgroundStyle: REVEL_DEFAULTS.backgroundStyle,
        logoUrl: null,
        faviconUrl: null,
        customCss: null,
      };

  return (
    <div
      className="flex h-screen overflow-hidden bg-[#faf9f6]"
      style={
        {
          "--brand-primary": branding.primaryColor,
          "--brand-secondary": branding.secondaryColor,
        } as React.CSSProperties
      }
    >
      <ClientSidebar
        userName={session.user.name}
        portalName={branding.portalName}
        portalSubtitle={branding.portalSubtitle}
        logoUrl={branding.logoUrl}
        primaryColor={branding.primaryColor}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
