"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Utensils, ArrowLeft, RefreshCw, Search, Clock } from "lucide-react";

interface MealRow {
  id: string;
  reservation_id: string;
  order_details: { item?: string; quantity?: number } | any;
  total_cost: number;
  status: string;
  created_at: string;
}

/**
 * Marakale Executive Owner Suite - Food & Beverage Revenue Workspace
 * Location: app/dashboard/owner/meals/page.tsx
 */
export default function OwnerMealsAuditWorkspace() {
  const [meals, setMeals] = useState<MealRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const pullMealTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("meal_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMeals((data as MealRow[]) || []);
    } catch (err) {
      console.error("Food sales ledger sync error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    pullMealTransactions();
  }, []);

  const filteredMeals = meals.filter(
    (m) =>
      m.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.order_details?.item?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Corrected: Changed ampersand out of variable name structure to clear compiler errors
  const accumulatedFoodRevenue = filteredMeals
    .filter((m) => m.status === "Delivered")
    .reduce((sum, m) => sum + Number(m.total_cost || 0), 0);

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
            <Utensils className="w-5 h-5 text-slate-900" /> Food & Beverage Sales Audit
          </h1>
        </div>
        
        <button onClick={pullMealTransactions} disabled={isLoading} className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 shadow-sm">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="relative rounded-md max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by item menu names..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-900 font-medium" />
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between col-span-1 md:col-span-2 max-w-xs md:ml-auto w-full">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Settled Dining Gross:</span>
          <span className="font-black text-xs text-emerald-700">K{accumulatedFoodRevenue.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 border-b border-slate-100 tracking-wider">
              <tr>
                <th className="p-3">Order Ticket Key</th>
                <th className="p-3">Timestamp Ordered</th>
                <th className="p-3">Itemized Gastronomy Description</th>
                <th className="p-3 text-right">Receipt Status</th>
                <th className="p-3 text-right">Charge Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
              {filteredMeals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-12 text-slate-400 italic">No food and beverage sales transactions found matching filter parameters.</td>
                </tr>
              ) : (
                filteredMeals.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-3 font-black text-slate-500 break-all">{m.id.slice(0, 8).toUpperCase()}...</td>
                    <td className="p-3 text-slate-500 font-semibold"><span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(m.created_at).toLocaleString()}</span></td>
                    <td className="p-3 text-slate-900 font-bold">{m.order_details?.item || "Premium Meal Package"} <span className="text-slate-400 font-normal">(x{m.order_details?.quantity || 1})</span></td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        m.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">K{Number(m.total_cost).toFixed(2)}</td>
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
