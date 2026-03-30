"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Menu } from "lucide-react";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  userRole: string;
}

export function AdminLayoutShell({ children, userName, userEmail, userRole }: AdminLayoutShellProps) {
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

      <AdminSidebar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#263a2e] border-b border-[#1e2e24] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/revel-icon.png" alt="Revel" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-[#ece9e1] font-semibold text-sm">Revel Admin</span>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
