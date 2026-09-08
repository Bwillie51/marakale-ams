"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { ReceiptPrinter } from "@/components/features/receipt-printer";
import { Formik, Form, Field } from "formik";
import { Receipt, Search, CreditCard, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface ActiveStayRecord {
  id: string;
  guest_name: string;
  guest_email: string;
  total_days: number;
  base_amount: number;
  discount_amount: number;
  gst_amount: number;
  net_amount: number;
  room_number?: string;
}

interface IncidentalItem {
  id: string;
  description: string;
  amount: number;
}

/**
 * Marakale Front-Desk Counter Checkout & Billing Processing Desk
 * Resolves active balances, aggregates incidental orders, and populates printable invoices.
 */
export default function CounterCheckoutDeskPage() {
  const [roomQuery, setRoomQuery] = useState("");
  const [activeStay, setActiveStay] = useState<ActiveStayRecord | null>(null);
  const [incidentalsList, setIncidentalsList] = useState<IncidentalItem[]>([]);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Core Transaction Locator Routine
  const handleLocateGuestStay = async (values: { searchRoomNumber: string }) => {
    setSearchFeedback(null);
    setActiveStay(null);
    setIncidentalsList([]);
    setCheckoutComplete(false);

    try {
      // Find room asset row to grab reference keys
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id, room_number, status")
        .eq("room_number", values.searchRoomNumber.trim())
        .single();

      if (roomError || !roomData) {
        setSearchFeedback("No living unit mapped matching that room designator code.");
        return;
      }

      if (roomData.status !== "Occupied") {
        setSearchFeedback(`Unit ${roomData.room_number} is currently ${roomData.status}. No active checkout ledger available.`);
        return;
      }

      // Query active reservations mapped to that designated room asset instance
      const { data: allocations, error: allocError } = await supabase
        .from("reservation_rooms")
        .select("reservation_id, reservations(*)")
        .eq("room_id", roomData.id);

      if (allocError || !allocations || allocations.length === 0) {
        setSearchFeedback("Failed to extract structural check-in linkages.");
        return;
      }

            // Track active checkout target data parameters (Explicitly typed to clear any[] index overrides)
      const activeRes: any = allocations.find((a: any) => a.reservations?.status === "Active")?.reservations;

      if (!activeRes) {
        setSearchFeedback("No initialized operational check-in rows located for this unit.");
        return;
      }

      setActiveStay({
        id: activeRes.id,
        guest_name: activeRes.guest_name,
        guest_email: activeRes.guest_email,
        total_days: activeRes.total_days,
        base_amount: Number(activeRes.base_amount || 0),
        discount_amount: Number(activeRes.discount_amount || 0),
        gst_amount: Number(activeRes.gst_amount || 0),
        net_amount: Number(activeRes.net_amount || 0),
        room_number: roomData.room_number
      });

      // 2. Aggregate Unpaid Restaurant Incidental Logs Natively
      const { data: mealOrders } = await supabase
        .from("meal_orders")
        .select("id, order_details, total_cost")
        .eq("reservation_id", activeRes.id)
        .eq("status", "Pending");


      if (mealOrders) {
        const aggregatedIncidentals = mealOrders.map((order: any) => ({
          id: order.id,
          description: `Restaurant Order: ${order.order_details?.item || "Food Package Tab"}`,
          amount: Number(order.total_cost || 0.00)
        }));
        setIncidentalsList(aggregatedIncidentals);
      }

    } catch (err) {
      console.error("Ledger extraction pipeline malfunction error:", err);
      setSearchFeedback("Internal pipeline exception error loading billing files.");
    }
  };

  // 3. Finalize Transaction Lifecycle Pipeline Processing Handlers
  const handleExecuteCheckoutRelease = async () => {
    if (!activeStay) return;
    setIsProcessing(true);

    try {
      // Step A: Close structural transaction logs by marking reservation completed
      const { error: resError } = await supabase
        .from("reservations")
        .update({ status: "Completed" })
        .eq("id", activeStay.id);

      if (resError) throw resError;

      // Step B: Flush pending incidentals and check off restaurant lines
      await supabase
        .from("meal_orders")
        .update({ status: "Delivered" })
        .eq("reservation_id", activeStay.id);

      // Step C: Revert living quarter tracking row state to Vacant cleanly
      const { data: roomRef } = await supabase
        .from("rooms")
        .select("id")
        .eq("room_number", activeStay.room_number)
        .single();

      if (roomRef) {
        await supabase
          .from("rooms")
          .update({ status: "Vacant" })
          .eq("id", roomRef.id);
      }

      setCheckoutComplete(true);
    } catch (err) {
      console.error("Checkout finalization processing failure:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 print:p-0">
      
      {/* Interactive Title Heading Banner Controls - Suppressed on Hard Copies */}
      <div className="border-b border-slate-200 pb-4 print:hidden">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Counter Billing Desk</h1>
        <p className="text-xs text-slate-500 font-normal">Settle pending transaction logs, reconcile incidental menus, and print final corporate receipts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        {/* Left Console Split Viewpane: Search & Balance Reviews (Takes 2/5 width) - Suppressed on print */}
        <div className="lg:col-span-2 space-y-4 print:hidden">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs uppercase border-b border-slate-50 pb-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Locate Active Guest Unit</span>
            </div>

            {/* Formik Checkout Form Query Setup */}
            <Formik initialValues={{ searchRoomNumber: "" }} onSubmit={handleLocateGuestStay}>
              {({ isSubmitting }) => (
                <Form className="flex gap-2">
                  <Field 
                    required 
                    name="searchRoomNumber" 
                    type="text" 
                    className="flex-grow px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 text-slate-900" 
                    placeholder="e.g., A-101" 
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    Search
                  </button>
                </Form>
              )}
            </Formik>

            {searchFeedback && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] leading-relaxed flex items-start gap-1.5 font-normal">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 mt-0.5" />
                <span>{searchFeedback}</span>
              </div>
            )}
          </div>

                    {/* Balance Preview Card */}
          {activeStay && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 animate-fade-in">
              <div className="border-b border-slate-100 pb-2">
                <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-slate-100 border text-slate-700">
                  Account Overview Summary
                </span>
                <h3 className="text-base font-black text-slate-900 mt-2">{activeStay.guest_name}</h3>
                <p className="text-[11px] text-slate-400 font-normal">{activeStay.guest_email}</p>
              </div>

              {checkoutComplete ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2 shadow-sm font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Checkout Complete</p>
                    <p className="text-emerald-700/90 mt-0.5 leading-normal">Room unit configuration cleared. The asset has returned to the public vacant inventory maps.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs space-y-1.5 text-slate-600 font-normal">
                    <div className="flex justify-between"><span>Lodging Subtotal:</span><span className="font-medium text-slate-900">${activeStay.base_amount.toFixed(2)}</span></div>
                    {activeStay.discount_amount > 0 && <div className="flex justify-between text-emerald-600"><span>Matrix Discount:</span><span>-${activeStay.discount_amount.toFixed(2)}</span></div>}
                    <div className="flex justify-between"><span>Aggregated Tax:</span><span>${activeStay.gst_amount.toFixed(2)}</span></div>
                    {incidentalsList.length > 0 && <div className="flex justify-between text-orange-600"><span>Incidentals Tab:</span><span>+${incidentalsList.reduce((s,i)=>s+i.amount,0).toFixed(2)}</span></div>}
                  </div>

                  <button
                    onClick={handleExecuteCheckoutRelease}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CreditCard className="w-3.5 h-3.5" />
                    )}
                    Process Release Payment
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Console Split Viewpane: Itemized Printable Receipt Template Viewport (Takes 3/5 width) */}
        <div className="lg:col-span-3 h-full">
          {activeStay ? (
            <div className="animate-scale-up">
              <ReceiptPrinter 
                invoiceNumber={activeStay.id.slice(0,8).toUpperCase()}
                guestName={activeStay.guest_name}
                guestEmail={activeStay.guest_email}
                roomNumber={activeStay.room_number || "A-UNK"}
                stayDays={activeStay.total_days}
                baseAmount={activeStay.base_amount}
                discountAmount={activeStay.discount_amount}
                gstAmount={activeStay.gst_amount}
                netAmount={activeStay.net_amount}
                incidentals={incidentalsList}
              />
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-8 bg-white shadow-sm min-h-[400px] flex flex-col items-center justify-center text-slate-400 print:hidden">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-3 text-slate-300">
                <Receipt className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Awaiting Unit Inquiry</p>
              <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1 leading-normal font-normal">
                Query an assigned occupied living quarters row parameter in the query tool drawer to compile billing structures or load active receipts.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
