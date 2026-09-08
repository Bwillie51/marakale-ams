"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { 
  ShieldCheck, 
  Sliders, 
  Users, 
  Activity, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  Lock,
  Database
} from "lucide-react";

interface AdminSummaryMetrics {
  totalStaffCount: number;
  activeTogglesCount: number;
  dbConnectionStatus: "Connected" | "Disconnected";
}

/**
 * Marakale Admin Root Control Center Gateway
 * Location: app/dashboard/admin/page.tsx
 * Serves as the primary landing dashboard hub for system administrators.
 */
export default function AdminRootLandingPage() {
  const [metrics, setMetrics] = useState<AdminSummaryMetrics>({
    totalStaffCount: 0,
    activeTogglesCount: 0,
    dbConnectionStatus: "Connected"
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Compile rapid system metrics for the administrative cockpit layout
  const loadSystemSummaryStats = async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch total registered staff profiles (admins + receptionists)
      const { data: staffData } = await supabase
        .from("profiles")
        .select("permissions")
        .in("role", ["admin", "receptionist"]);

      // 2. Count total true values inside active permission arrays to aggregate status counters
      let trueFlagsCount = 0;
      staffData?.forEach((profile: any) => {
        if (profile.permissions) {
          Object.values(profile.permissions).forEach((val) => {
            if (val === true) trueFlagsCount++;
          });
        }
      });

      setMetrics({
        totalStaffCount: staffData?.length || 0,
        activeTogglesCount: trueFlagsCount,
        dbConnectionStatus: "Connected"
      });
    } catch (err) {
      console.error("Admin dashboard tracking compilation failure:", err);
      setMetrics((prev) => ({ ...prev, dbConnectionStatus: "Disconnected" }));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadSystemSummaryStats();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Upper Cockpit Identity Context Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-slate-900" /> Admin Control Panel
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            System administration console. Govern security access scopes and configure global application operational states.
          </p>
        </div>

        <button
          onClick={loadSystemSummaryStats}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          Refresh Registry
        </button>
      </div>

      {/* Real-Time Live System Status Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Governed Operators</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.totalStaffCount} Profiles</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Privilege Flags</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{metrics.activeTogglesCount} Enabled</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Supabase Pool Health</span>
            <Database className={`w-4 h-4 ${metrics.dbConnectionStatus === "Connected" ? "text-emerald-500" : "text-red-500"}`} />
          </div>
          <p className="text-2xl font-black text-slate-900 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${metrics.dbConnectionStatus === "Connected" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            {metrics.dbConnectionStatus}
          </p>
        </div>
      </div>

      {/* Operational Module Access Interface Links Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Core Security Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Link Gateway 1: Feature Flags Sub-Module (Permissions Matrix) */}
          <Link 
            href="/dashboard/admin/permissions"
            className="group bg-white border border-slate-200 hover:border-slate-400 p-6 rounded-xl shadow-sm flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase">Permissions Matrix</h4>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                  Tweak granular staff feature controls, max discount thresholds, and cash walk-in clearances.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Link Gateway 2: Lock Configuration Reference Panel */}
          <div className="bg-white border border-slate-200 opacity-60 p-6 rounded-xl shadow-sm flex items-center justify-between select-none">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-400 uppercase">System Auditing Logs</h4>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  Review historical database action streams and cryptographic access triggers. *(Owner Clearance Required)*
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
