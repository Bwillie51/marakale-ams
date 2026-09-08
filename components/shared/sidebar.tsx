"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { 
  Bell, 
  BedDouble, 
  Receipt, 
  ShieldAlert, 
  UserCheck, 
  LogOut, 
  Building2,
  PieChart
} from "lucide-react";

interface SidebarProps {
  /** Core operator parameters determining shortcut menu allocation lists */
  user: {
    role: "owner" | "admin" | "receptionist";
  };
}

/**
 * Marakale Dynamic Navigation Sidebar Component
 * Conditionally renders system control pathways using explicit role matrices.
 */
export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogoutSession = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Base workstation configuration links shared across general staff
  const generalLinks = [
    {
      href: "/dashboard/reception/notifications",
      label: "Live Operations Desk",
      icon: Bell,
      roles: ["owner", "admin", "receptionist"],
    },
    {
      href: "/dashboard/reception/bookings",
      label: "Room Allocation Table",
      icon: BedDouble,
      roles: ["owner", "admin", "receptionist"],
    },
    {
      href: "/dashboard/reception/checkout",
      label: "Counter Billing Desk",
      icon: Receipt,
      roles: ["owner", "admin", "receptionist"],
    },
  ];

  // Higher-level governance controls restricted by privileges
  const executiveLinks = [
    {
      href: "/dashboard/admin/permissions",
      label: "Feature Flag Matrices",
      icon: ShieldAlert,
      roles: ["owner", "admin"],
    },
    {
      href: "/dashboard/owner",
      label: "Financial Analytics Suite",
      icon: PieChart,
      roles: ["owner"],
    },
    {
      href: "/dashboard/owner/users",
      label: "Global Account Seizures",
      icon: UserCheck,
      roles: ["owner"],
    },
  ];

  const consolidatedMenu = [...generalLinks, ...executiveLinks].filter((link) =>
    link.roles.includes(user.role)
  );

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-64px)] flex flex-col justify-between p-4 sticky left-0 z-30 shadow-sm">
      <div className="space-y-6">
        {/* Core Property Context Summary Banner */}
        <div className="flex items-center gap-3 px-2 py-3 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight">Marakale AMS</h4>
            <p className="text-[10px] text-slate-400 font-medium capitalize">Version 1.1 Secure</p>
          </div>
        </div>

        {/* Dynamic Nav Link Group Stream */}
        <nav className="space-y-1">
          {consolidatedMenu.map((item) => {
            const IconComponent = item.icon;
            const isLinkActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  w-full 
                  flex 
                  items-center 
                  gap-3 
                  px-3 
                  py-2.5 
                  text-xs 
                  font-bold 
                  uppercase 
                  tracking-wider 
                  rounded-lg 
                  transition-all 
                  ${isLinkActive 
                    ? "bg-slate-950 text-white shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }
                `}
              >
                <IconComponent className={`w-4 h-4 ${isLinkActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Persistent Base Action Footer Drawer */}
      <div className="border-t border-slate-100 pt-4">
        <button
          onClick={handleLogoutSession}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Terminate Session</span>
        </button>
      </div>
    </aside>
  );
}
