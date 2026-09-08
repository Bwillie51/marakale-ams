"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { 
  Bell, 
  BedDouble, 
  Receipt, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface OperationalSummary {
  vacantCount: number;
  occupiedCount: number;
  preBookedCount: number;
  totalPendingAlerts: number;
}

/**
 * Marakale Front-Desk Reception Landing Command Center Gateway
 * Location: app/dashboard/reception/page.tsx
 * Acts as the default base layout view for the /dashboard/reception endpoint.
 */
export default function ReceptionBaseLandingPage() {
  const [summary, setSummary] = useState<OperationalSummary>({
    vacantCount: 0,
    occupiedCount: 0,
    preBookedCount: 0,
    totalPendingAlerts: 0
  });
  const [isCompiling, setIsCompiling] = useState(false);

  // Compile real-time metrics for the landing cockpit layout
  const loadWorkspaceSummaryMetrics = async () => {
    setIsCompiling(true);
    try {
      // 1. Fetch room distributions dynamically
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("status");

      // 2. Fetch pending real-time dashboard notifications count
      const { data: alertsData } = await supabase
        .from("system_notifications")
        .select("id")
        .eq("is_read", false);

      const computedStats = { vacantCount: 0, occupiedCount: 0, preBookedCount: 0, totalPendingAlerts: alertsData?.length || 0 };
      
      roomsData?.forEach((room: any) => {
        if (room.status === "Vacant") computedStats.vacantCount++;
        if (room.status === "Occupied") computedStats.occupiedCount++;
        if (room.status === "Pre-Booked") computedStats.preBookedCount++;
      });

      setSummary(computedStats);
    } catch (err) {
      console.error("Dashboard metric aggregation pipeline failure:", err);
    } finally {
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    loadWorkspaceSummaryMetrics();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Upper Cockpit Identity Context Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Front-Desk Terminal</h1>
          <p className="text-xs text-slate-500 font-normal">Welcome to the Marakale operational command center. Monitor properties and execute room allocations.</p>
        </div>

        <button
          onClick={loadWorkspaceSummaryMetrics}
          disabled={isCompiling}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? "animate-spin" : ""}`} />
          Refresh Stats
        </button>
      </div>

      {/* Real-Time Live Status Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Vacant Suites</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.vacantCount} Units</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Active Occupancy</span>
            <BedDouble className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.occupiedCount} Units</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">24h Pre-Book Holds</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.preBookedCount} Units</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Unread Operations Alerts</span>
            <Bell className={`w-4 h-4 ${summary.totalPendingAlerts > 0 ? "text-red-500 animate-pulse" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black text-slate-900">{summary.totalPendingAlerts} Alerts</p>
        </div>
      </div>

      {/* Operational Module Access Interface Links Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Quick Action Shortcuts</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Link Gateway A: Notifications Operations Desk */}
          <Link 
            href="/dashboard/reception/notifications"
            className="group bg-white border border-slate-200 hover:border-slate-400 p-5 rounded-xl shadow-sm flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-slate-900">Operations Feed</h4>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">Manage live requests and incoming bookings streams.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Link Gateway B: Room Grid Allocations */}
          <Link 
            href="/dashboard/reception/bookings"
            className="group bg-white border border-slate-200 hover:border-slate-400 p-5 rounded-xl shadow-sm flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BedDouble className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-slate-900">Allocation Table</h4>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">Audit live suite vacancies and rate parameters details.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Link Gateway C: Counter Billing Invoicing */}
          <Link 
            href="/dashboard/reception/checkout"
            className="group bg-white border border-slate-200 hover:border-slate-400 p-5 rounded-xl shadow-sm flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 group-hover:text-slate-900">Billing Desk</h4>
                <p className="text-[11px] text-slate-500 font-normal mt-0.5">Process checkout parameters and print invoices.</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

    </div>
  );
}
