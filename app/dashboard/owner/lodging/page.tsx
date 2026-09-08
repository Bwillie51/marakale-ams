"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { BedDouble, ArrowLeft, RefreshCw, Search, Calendar, Landmark } from "lucide-react";

interface LodgingRow {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  net_amount: number;
  status: string;
  total_days: number;
}

/**
 * Marakale Executive Owner Suite - Lodging Registry Folder Desk
 * Location: app/dashboard/owner/lodging/page.tsx
 */
export default function OwnerLodgingAuditWorkspace() {
  const [ledger, setLedger] = useState<LodgingRow[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const pullLodgingRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("check_in", { ascending: false });

      if (error) throw error;
      setLedger((data as LodgingRow[]) || []);
    } catch (err) {
      console.error("Lodging transaction log sync exception:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    pullLodgingRecords();
  }, []);

  // Filter grid columns based on guest specifications strings
  const filteredRows = ledger.filter(
    (row) =>
      row.guest_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      row.guest_email?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const grossAggregateValue = filteredRows.reduce((sum, r) => sum + Number(r.net_amount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 antialiased text-slate-800">
      
      {/* Upper Direct Workspace Navigation Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div className="space-y-1">
          <Link 
            href="/dashboard/owner" 
            className="text-xs font-bold text-slate-400 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Executive Overview
          </Link>
          <h1 className="text-xl font-black uppercase text-slate-900 flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-slate-900" /> Lodging Registry Ledger
          </h1>
        </div>
        
        <button 
          onClick={pullLodgingRecords} 
          disabled={isLoading}
          className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Metric Sub-Banner & Query Filter Desk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="relative rounded-xl max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <input 
            type="text" 
            value={searchFilter} 
            onChange={(e) => setSearchFilter(e.target.value)} 
            placeholder="Search by guest name or email coordinates..." 
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-900 font-medium" 
          />
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between col-span-1 md:col-span-2 max-w-xs md:ml-auto w-full">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Filtered Volume:</span>
          </div>
          <span className="font-black text-xs text-slate-900">K{grossAggregateValue.toFixed(2)}</span>
        </div>
      </div>

      {/* Lodging Audit Registry Sheet Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-100 tracking-wider">
              <tr>
                <th className="p-3">Guest Parameters</th>
                <th className="p-3">Check-In Chronology</th>
                <th className="p-3">Check-Out Chronology</th>
                <th className="p-3">Duration Scale</th>
                <th className="p-3 text-right">Settled Amount</th>
                <th className="p-3 text-right">System State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-slate-400 italic">No room accommodation transactions located matching query parameters.</td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{row.guest_name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{row.guest_email}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {new Date(row.check_in).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-400" /> {new Date(row.check_out).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
                    </td>
                    <td className="p-3 font-bold text-slate-900">{row.total_days} Nights</td>
                    <td className="p-3 text-right font-black text-slate-900">K{Number(row.net_amount).toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        row.status === "Active" ? "bg-red-50 text-red-700 border-red-100" : "bg-emerald-50 text-emerald-700 border-emerald-100"
                      }`}>
                        {row.status}
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
