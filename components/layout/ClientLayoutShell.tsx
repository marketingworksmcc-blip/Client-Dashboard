"use client";

import { useState } from "react";
import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { Menu } from "lucide-react";

interface ClientLayoutShellProps {
  children: React.ReactNode;
  userName: string;
  portalName: string;
  portalSubtitle?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  pendingProofsCount?: number;
  teamworkEnabled?: boolean;
}

export function ClientLayoutShell({
  children,
  userName,
  portalName,
  portalSubtitle,
  logoUrl,
  primaryColor = "#d3de2c",
  pendingProofsCount = 0,
  teamworkEnabled = false,
}: ClientLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#faf9f6]">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ClientSidebar
        userName={userName}
        portalName={portalName}
        portalSubtitle={portalSubtitle}
        logoUrl={logoUrl}
        primaryColor={primaryColor}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingProofsCount={pendingProofsCount}
        teamworkEnabled={teamworkEnabled}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#263a2e] border-b border-[#1e2e24] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt={portalName} className="w-7 h-7 rounded-lg object-cover bg-white p-0.5" />
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: primaryColor }}>
                <span className="text-[#263a2e] font-bold text-xs">{portalName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="text-[#ece9e1] font-semibold text-sm truncate max-w-[140px]">{portalName}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#cad1cc] hover:text-[#ece9e1] transition-colors p-1.5 -mr-1"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
