import { prisma } from "@/lib/prisma";

export const REVEL_DEFAULTS = {
  portalName: "Revel Client Portal",
  portalSubtitle: "Your creative work, all in one place.",
  primaryColor: "#d3de2c",
  secondaryColor: "#263a2e",
  backgroundStyle: "default",
} as const;

export type BrandingConfig = {
  portalName: string;
  portalSubtitle: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundStyle: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  customCss: string | null;
};

export async function getClientBranding(clientId: string): Promise<BrandingConfig> {
  const settings = await prisma.clientBrandSettings.findUnique({
    where: { clientId },
  });

  return {
    portalName: settings?.portalName ?? REVEL_DEFAULTS.portalName,
    portalSubtitle: settings?.portalSubtitle ?? REVEL_DEFAULTS.portalSubtitle,
    primaryColor: settings?.primaryColor ?? REVEL_DEFAULTS.primaryColor,
    secondaryColor: settings?.secondaryColor ?? REVEL_DEFAULTS.secondaryColor,
    backgroundStyle: settings?.backgroundStyle ?? REVEL_DEFAULTS.backgroundStyle,
    logoUrl: settings?.logoUrl ?? null,
    faviconUrl: settings?.faviconUrl ?? null,
    customCss: settings?.customCss ?? null,
  };
}

export function brandingToCssVars(branding: BrandingConfig): string {
  return [
    `--brand-primary: ${branding.primaryColor};`,
    `--brand-secondary: ${branding.secondaryColor};`,
  ].join(" ");
}
