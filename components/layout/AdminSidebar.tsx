"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  ImageIcon,
  FileText,
  CheckSquare,
  BarChart2,
  DollarSign,
  Settings,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Building2 },
  { href: "/admin/proofs", label: "Proofs", icon: ImageIcon },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/budget", label: "Budget", icon: DollarSign },
  { href: "/admin/users", label: "Users", icon: Users },
];

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
}

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  REVEL_ADMIN: "Admin",
  REVEL_TEAM: "Team Member",
};

export function AdminSidebar({ userName, userEmail, userRole, isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside
      className={cn(
        "w-64 flex-shrink-0 flex flex-col bg-[#263a2e] border-r border-[#1e2e24]",
        // Mobile: fixed overlay, slide in/out
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        // Desktop: sticky, always visible
        "lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0",
        // Mobile visibility
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}
    >
      {/* Logo + close button */}
      <div className="px-5 py-5 border-b border-[#1e2e24]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/revel-icon.png" alt="Revel" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[#ece9e1] font-semibold text-sm leading-tight truncate">Revel</p>
              <p className="text-[#cad1cc] text-xs leading-tight opacity-70">Admin Portal</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden text-[#cad1cc] hover:text-[#ece9e1] transition-colors p-1 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive
                  ? "bg-[#d3de2c]/15 text-[#d3de2c]"
                  : "text-[#cad1cc] hover:bg-[#1e2e24] hover:text-[#ece9e1]"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 flex-shrink-0 transition-colors",
                  isActive ? "text-[#d3de2c]" : "text-[#cad1cc] group-hover:text-[#ece9e1]"
                )}
              />
              {item.label}
              {isActive && <ChevronRight className="h-3 w-3 ml-auto text-[#d3de2c] opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Settings + User */}
      <div className="border-t border-[#1e2e24] p-3 space-y-1">
        <Link
          href="/admin/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            pathname.startsWith("/admin/settings")
              ? "bg-[#d3de2c]/15 text-[#d3de2c]"
              : "text-[#cad1cc] hover:bg-[#1e2e24] hover:text-[#ece9e1]"
          )}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          Settings
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mt-2">
          <img src="/revel-icon.png" alt="Revel" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[#ece9e1] text-xs font-medium truncate">{userName}</p>
            <p className="text-[#cad1cc] text-xs opacity-60 truncate">{roleLabel[userRole] ?? userRole}</p>
          </div>
          <Button
            variant="ghost" size="icon"
            className="h-6 w-6 text-[#cad1cc] hover:text-[#ff6b6c] hover:bg-transparent flex-shrink-0"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
