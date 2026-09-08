"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { CounterBadge } from "../features/counter-badge";
import { BedDouble, Utensils, Wrench, Bell, LogOut, User } from "lucide-react";

interface TopbarProps {
  counts?: {
    rooms: number;
    restaurant: number;
    service: number;
  };
}

/**
 * Marakale Real-Time Dynamic Topbar Monitoring Header
 * Location: components/shared/topbar.tsx
 * Displays active operator identity signatures and executes global session termination.
 */
export function Topbar({ counts = { rooms: 0, restaurant: 0, service: 0 } }: TopbarProps) {
  const router = useRouter();
  const [operatorName, setOperatorName] = useState<string>("Loading operator...");
  const [operatorRole, setOperatorRole] = useState<string>("staff");
  const totalNotifications = counts.rooms + counts.restaurant + counts.service;

  // Fetch verified user session information cleanly upon mounting
  useEffect(() => {
    const fetchActiveIdentitySignature = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", sessionData.session.user.id)
        .single();

      if (profile) {
        setOperatorName(profile.full_name);
        setOperatorRole(profile.role);
      }
    };
    fetchActiveIdentitySignature();
  }, []);

  const handleGlobalLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleLogoNavigation = () => {
    if (operatorRole === "owner") router.push("/dashboard/owner");
    else if (operatorRole === "admin") router.push("/dashboard/admin/permissions");
    else router.push("/dashboard/reception");
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm print:hidden">
      
      {/* LEFT ASPECT: Active User Identity Signature Signoff */}
      <div className="flex items-center gap-3">
        <div 
          onClick={handleLogoNavigation} 
          className="flex flex-col cursor-pointer bg-slate-900 text-white px-3 py-1 rounded-lg hover:bg-slate-800 transition-all"
          title="Return to primary module home"
        >
          <span className="font-black tracking-tight text-xs uppercase">Marakale Control</span>
        </div>
        
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 text-slate-700">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-black tracking-tight text-slate-900">
            {operatorName}
          </span>
          <span className="bg-slate-100 text-slate-700 font-extrabold px-1.5 py-0.5 rounded text-[9px] uppercase border border-slate-200">
            {operatorRole}
          </span>
        </div>
      </div>

      {/* CENTRAL ASPECT: Live Notification Streams Routing Selectors */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push("/dashboard/reception/notifications")}
          className="flex items-center gap-1.5 p-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-all text-xs font-semibold relative"
        >
          <BedDouble className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Online Services</span>
          <CounterBadge count={counts.rooms} variant="default" />
        </button>

        
      </div>

      {/* RIGHT ASPECT: Global Alarm Ring Indicator & Unified Session Terminate Trigger */}
      <div className="flex items-center gap-4 pl-2 border-l border-slate-100">
        <div className="relative p-1.5 rounded-full bg-slate-50 text-slate-600 hidden xs:block">
          <Bell className={`w-4 h-4 ${totalNotifications > 0 ? "text-red-500 animate-pulse" : "text-slate-400"}`} />
          {totalNotifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white" />
          )}
        </div>

        <button
          onClick={handleGlobalLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold uppercase text-[10px] tracking-wide rounded-lg transition-all shadow-sm"
          title="Log out and terminate current session context safely"
        >
          <LogOut className="w-3.5 h-3.5 text-red-600" />
          <span>Logout</span>
        </button>
      </div>

    </header>
  );
}
