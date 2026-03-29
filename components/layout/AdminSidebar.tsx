"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
}

export function AdminSidebar({ userName, userEmail, userRole }: AdminSidebarProps) {
  const pathname = usePathname();

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    REVEL_ADMIN: "Admin",
    REVEL_TEAM: "Team Member",
  };

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-[#263a2e] border-r border-[#1e2e24]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1e2e24]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d3de2c] flex items-center justify-center flex-shrink-0">
            <span className="text-[#263a2e] font-bold text-sm">R</span>
          </div>
          <div className="min-w-0">
            <p className="text-[#ece9e1] font-semibold text-sm leading-tight truncate">
              Revel
            </p>
            <p className="text-[#cad1cc] text-xs leading-tight opacity-70">
              Admin Portal
            </p>
          </div>
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
              {isActive && (
                <ChevronRight className="h-3 w-3 ml-auto text-[#d3de2c] opacity-60" />
              )}
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
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="bg-[#d3de2c] text-[#263a2e] text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[#ece9e1] text-xs font-medium truncate">{userName}</p>
            <p className="text-[#cad1cc] text-xs opacity-60 truncate">
              {roleLabel[userRole] ?? userRole}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
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
