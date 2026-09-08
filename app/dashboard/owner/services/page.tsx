"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Wrench, ArrowLeft, RefreshCw, Search, ShieldCheck, ClipboardList } from "lucide-react";

interface ServiceRow {
  id: string;
  reservation_id: string;
  issue_description: string;
  status: string;
  created_at: string;
}

/**
 * Marakale Executive Owner Suite - In-Room Service & Upkeep Monitoring Dashboard
 * Location: app/dashboard/owner/services/page.tsx
 */
export default function OwnerServicesAuditWorkspace() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const pullServiceTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setServices((data as ServiceRow[]) || []);
    } catch (err) {
      console.error("Service request ledger synchronization failure:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    pullServiceTickets();
  }, []);

  const filteredServices = services.filter(
    (s) =>
      s.issue_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingIssuesCount = filteredServices.filter((s) => s.status === "Pending").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 antialiased text-slate-800">
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div className="space-y-1">
          <Link 
            href="/dashboard/owner" 
            className="text-xs font-bold text-slate-400 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Executive Overview
          </Link>
          <h1 className="text-xl font-black uppercase text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-slate-900" /> Maintenance & Support Feeds
          </h1>
        </div>
        
        <button onClick={pullServiceTickets} disabled={isLoading} className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 shadow-sm">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="relative rounded-md max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search room service or technical issue content logs..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-900 font-medium" />
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between col-span-1 md:col-span-2 max-w-xs md:ml-auto w-full">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5 text-amber-500" /> Active Backlog Queue:</span>
          <span className="font-black text-xs text-amber-700">{pendingIssuesCount} Pending Tasks</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-100 tracking-wider">
              <tr>
                <th className="p-3">Log Arrival Time</th>
                <th className="p-3">Reservation Map Reference</th>
                <th className="p-3">Engineering Repair Request Description</th>
                <th className="p-3 text-right">Current Action State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-12 text-slate-400 italic">No cleaning or support requests found inside the active tracking database logs.</td>
                </tr>
              ) : (
                filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 text-slate-400 font-semibold">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="p-3 text-slate-500 font-bold break-all">{s.reservation_id.slice(0, 8).toUpperCase()}...</td>
                    <td className="p-3 text-slate-900 font-bold">{s.issue_description}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        s.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-100 animate-pulse" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
