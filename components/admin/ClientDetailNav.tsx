"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ClientDetailNavProps {
  clientId: string;
}

export function ClientDetailNav({ clientId }: ClientDetailNavProps) {
  const pathname = usePathname();
  const base = `/admin/clients/${clientId}`;

  const tabs = [
    { href: base, label: "Overview" },
    { href: `${base}/users`, label: "Users" },
    { href: `${base}/branding`, label: "Branding" },
    { href: `${base}/proofs`, label: "Proofs" },
    { href: `${base}/documents`, label: "Documents" },
    { href: `${base}/tasks`, label: "Tasks" },
    { href: `${base}/analytics`, label: "Analytics" },
    { href: `${base}/budget`, label: "Budget" },
    { href: `${base}/teamwork`, label: "Teamwork" },
  ];

  return (
    <div className="relative mt-5">
      <div className="flex items-center gap-0.5 border-b border-[#e2e0d9] overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              isActive
                ? "border-[#263a2e] text-[#263a2e]"
                : "border-transparent text-[#8a8880] hover:text-[#464540] hover:border-[#e2e0d9]"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
      </div>
    </div>
  );
}
