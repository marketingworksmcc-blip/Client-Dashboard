"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, ImageIcon, FileText, CheckSquare } from "lucide-react";

interface BrandingPreviewProps {
  portalName: string;
  portalSubtitle: string;
  primaryColor: string;
  secondaryColor: string;
}

export function BrandingPreview({
  portalName,
  portalSubtitle,
  primaryColor,
  secondaryColor,
}: BrandingPreviewProps) {
  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, active: true },
    { label: "Proofs", icon: ImageIcon, active: false },
    { label: "Documents", icon: FileText, active: false },
    { label: "Tasks", icon: CheckSquare, active: false },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portal Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl overflow-hidden border border-[#e2e0d9] flex h-64 scale-100">
          {/* Mini sidebar */}
          <div
            className="w-36 flex-shrink-0 flex flex-col py-3 px-2"
            style={{ backgroundColor: secondaryColor }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2 px-2 pb-3 mb-2 border-b border-white/10">
              <div
                className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                style={{ backgroundColor: primaryColor, color: secondaryColor }}
              >
                {portalName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-[9px] font-semibold truncate leading-tight">
                  {portalName || "Portal Name"}
                </p>
                {portalSubtitle && (
                  <p className="text-white/50 text-[8px] truncate leading-tight">
                    {portalSubtitle}
                  </p>
                )}
              </div>
            </div>
            {/* Nav items */}
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded text-[9px] font-medium"
                    style={
                      item.active
                        ? {
                            backgroundColor: `${primaryColor}22`,
                            color: primaryColor,
                          }
                        : { color: "rgba(255,255,255,0.6)" }
                    }
                  >
                    <Icon className="h-2.5 w-2.5 flex-shrink-0" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini content area */}
          <div className="flex-1 bg-[#faf9f6] p-3 overflow-hidden">
            <div
              className="text-[10px] font-semibold mb-2"
              style={{ fontFamily: "Georgia, serif", color: "#464540" }}
            >
              Welcome back
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[primaryColor, "#f0efe9", "#f0efe9", "#f0efe9"].map((bg, i) => (
                <div
                  key={i}
                  className="rounded-lg p-2"
                  style={{ backgroundColor: i === 0 ? `${bg}18` : bg, border: "1px solid #e2e0d9" }}
                >
                  <div className="text-[8px] text-[#8a8880] mb-0.5">METRIC</div>
                  <div className="text-[11px] font-semibold text-[#464540]">—</div>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-white border border-[#e2e0d9] p-2">
              <div className="text-[9px] font-semibold text-[#464540] mb-1">Recent Activity</div>
              <div className="text-[8px] text-[#8a8880]">No recent activity</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#8a8880] mt-3 text-center">
          Live preview — updates when you save
        </p>
      </CardContent>
    </Card>
  );
}
