"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ImageIcon,
  FileText,
  CheckSquare,
  BarChart2,
  DollarSign,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/proofs", label: "Proofs", icon: ImageIcon },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/budget", label: "Budget", icon: DollarSign },
];

interface ClientSidebarProps {
  userName: string;
  portalName: string;
  portalSubtitle?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ClientSidebar({
  userName,
  portalName,
  portalSubtitle,
  logoUrl,
  primaryColor = "#d3de2c",
  isOpen,
  onClose,
}: ClientSidebarProps) {
  const pathname = usePathname();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside
      className={cn(
        "w-64 flex-shrink-0 flex flex-col bg-[#263a2e] border-r border-[#1e2e24]",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        "lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}
      style={{ "--brand-primary": primaryColor } as React.CSSProperties}
    >
      {/* Portal Brand */}
      <div className="px-5 py-5 border-b border-[#1e2e24]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt={portalName}
                className="w-8 h-8 rounded-lg object-contain flex-shrink-0 bg-white p-0.5" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: primaryColor }}>
                <span className="text-[#263a2e] font-bold text-sm">{portalName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[#ece9e1] font-semibold text-sm leading-tight truncate">{portalName}</p>
              {portalSubtitle && (
                <p className="text-[#cad1cc] text-xs leading-tight opacity-70 truncate">{portalSubtitle}</p>
              )}
            </div>
          </div>
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
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                isActive ? "text-[#263a2e]" : "text-[#cad1cc] hover:bg-[#1e2e24] hover:text-[#ece9e1]"
              )}
              style={isActive ? { backgroundColor: `${primaryColor}22`, color: primaryColor } : {}}
            >
              <Icon
                className={cn("h-4 w-4 flex-shrink-0 transition-colors",
                  !isActive && "text-[#cad1cc] group-hover:text-[#ece9e1]"
                )}
                style={isActive ? { color: primaryColor } : {}}
              />
              {item.label}
              {isActive && (
                <ChevronRight className="h-3 w-3 ml-auto opacity-60" style={{ color: primaryColor }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-[#1e2e24] p-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <img src="/revel-icon.png" alt="Revel" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[#ece9e1] text-xs font-medium truncate">{userName}</p>
            <p className="text-[#cad1cc] text-xs opacity-60">Client Portal</p>
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
