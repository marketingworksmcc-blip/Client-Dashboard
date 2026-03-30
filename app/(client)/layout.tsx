import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isClientUser } from "@/lib/permissions";
import { ClientLayoutShell } from "@/components/layout/ClientLayoutShell";
import { getClientBranding, REVEL_DEFAULTS } from "@/lib/branding";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if (!isClientUser(session.user.role)) redirect("/admin/dashboard");

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
      style={
        {
          "--brand-primary": branding.primaryColor,
          "--brand-secondary": branding.secondaryColor,
        } as React.CSSProperties
      }
    >
      <ClientLayoutShell
        userName={session.user.name ?? ""}
        portalName={branding.portalName ?? REVEL_DEFAULTS.portalName}
        portalSubtitle={branding.portalSubtitle ?? undefined}
        logoUrl={branding.logoUrl}
        primaryColor={branding.primaryColor ?? REVEL_DEFAULTS.primaryColor}
      >
        {children}
      </ClientLayoutShell>
    </div>
  );
}
