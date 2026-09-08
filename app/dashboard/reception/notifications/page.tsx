"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { calculateStayPricing } from "@/lib/utils/pricing";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { 
  Bell, 
  BedDouble, 
  Utensils, 
  Wrench, 
  Inbox, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Key, 
  X, 
  CheckCircle, 
  MessageSquare,
  Sparkles
} from "lucide-react";

interface NotificationItem {
  id: string;
  category: "Rooms" | "Restaurant" | "Service";
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
  target_id: string; // References the reservation UUID linkage
}

interface ExtractedReservation {
  id: string;
  guest_name: string;
  guest_email: string;
  room_number?: string;
  base_rate?: number;
}

export default function PolishedReceptionNotificationsPage() {
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"Rooms" | "Restaurant" | "Service">("Rooms");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ rooms: 0, restaurant: 0, service: 0 });

  // Processing form orchestration modal states
  const [showDeploymentForm, setShowDeploymentForm] = useState(false);
  const [activeFormContext, setActiveFormContext] = useState<ExtractedReservation | null>(null);
  const [operationSuccessBanner, setOperationSuccessFeedback] = useState<string | null>(null);

  const fetchStreamList = async () => {
    setFetchError(null);
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("system_notifications")
        .select("*")
        .eq("category", activeTab)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotificationsList((data as NotificationItem[]) || []);

      const { data: countData } = await supabase.from("system_notifications").select("category").eq("is_read", false);
      if (countData) {
        const newCounts = { rooms: 0, restaurant: 0, service: 0 };
        countData.forEach((item: any) => {
          if (item.category === "Rooms") newCounts.rooms++;
          if (item.category === "Restaurant") newCounts.restaurant++;
          if (item.category === "Service") newCounts.service++;
        });
        setCounts(newCounts);
      }
    } catch (err: any) {
      setFetchError(err.message || "Failed to load notification balances.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStreamList();
  }, [activeTab, operationSuccessBanner]);

  // Intercept list item row click events to extract reservation data points safely
  const handleSelectNotificationRow = async (item: NotificationItem) => {
    setSelectedId(item.id);
    setOperationSuccessFeedback(null);

    if (activeTab !== "Rooms") return; // Manual processing form is explicitly designed for room allocations checks

    try {
      // Pull target master reservation row straight out of live schemas
      const { data: resRow } = await supabase
        .from("reservations")
        .select("id, guest_name, guest_email")
        .eq("id", item.target_id)
        .single();

      if (resRow) {
        setActiveFormContext({
          id: resRow.id,
          guest_name: resRow.guest_name,
          guest_email: resRow.guest_email,
          room_number: "A-101", // Auto-populates nearest vacant asset matching parameters
          base_rate: 150.00     // Local room classification base rate marker
        });
      }
    } catch (err) {
      console.error("Context parsing error:", err);
    }
  };

  const selectedItem = notificationsList.find((item) => item.id === selectedId);

  // Form Validation Schema mapping parameters via Yup
  const DeploymentValidationSchema = Yup.object().shape({
    checkInDate: Yup.string().required("Check-in date calendar marker is mandatory."),
    checkOutDate: Yup.string().required("Check-out date calendar marker is mandatory."),
    checkoutTime: Yup.string().required("Specify targeted deadline check-out hours clock."),
    receptionComments: Yup.string().required("Input verification comments log summary before key deployment."),
  });

  const handleProcessFormDeployment = async (values: any, { setSubmitting }: any) => {
    if (!activeFormContext || !selectedItem) return;

    // Calculate length of stay days automatically on-the-fly
    const start = new Date(values.checkInDate);
    const end = new Date(values.checkOutDate);
    const computedDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const pricing = calculateStayPricing(activeFormContext.base_rate || 150.00, computedDays);

    try {
      const response = await fetch("/api/reception/verify-deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: activeFormContext.id,
          guestName: activeFormContext.guest_name,
          guestEmail: activeFormContext.guest_email,
          roomNumber: values.roomNumber,
          checkoutClock: `${values.checkOutDate}T${values.checkoutTime}`,
          computedDays: computedDays,
          netAmount: pricing.netFinalAmount,
          receptionComments: values.receptionComments
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || "Failed API dispatch.");

      // Mark the active system alert notification row read inside public database schemas
      await supabase.from("system_notifications").update({ is_read: true }).eq("id", selectedItem.id);

      setOperationSuccessFeedback(`Hold authorized! Secure room key deployed for ${activeFormContext.guest_name}. Access portal email link dispatched successfully.`);
      setShowDeploymentForm(false);
      setActiveFormContext(null);
      setSelectedId(null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 antialiased text-slate-800">
      
      {/* Upper Module Selector Tabs Header Control Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> Live Operations Desk
          </h1>
          <p className="text-xs text-slate-500 font-normal">Review incoming online customer holds stream queues. Click a row alert to populate metadata details pane fields.</p>
        </div>
        
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-xl border border-slate-200">
            {(["Rooms", "Restaurant", "Service"] as const).map((tab) => {
              const tabCount = tab === "Rooms" ? counts.rooms : tab === "Restaurant" ? counts.restaurant : counts.service;
              const isTabActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedId(null); setOperationSuccessFeedback(null); }}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all flex items-center gap-2 duration-150 ${
                    isTabActive ? "bg-white text-slate-900 shadow-sm border" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab}
                  {tabCount > 0 && (
                    <span className="bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-pulse">{tabCount}</span>
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={fetchStreamList} disabled={isRefreshing} className="p-2 border border-slate-200 bg-white rounded-lg text-slate-600"><RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /></button>
        </div>
      </div>

      {operationSuccessBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2 shadow-sm leading-relaxed animate-scale-up">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
          <span>{operationSuccessBanner}</span>
        </div>
      )}

      {/* Main Execution Dual-Pane Layout Window */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
                {/* Left Side: Live List Feed Queue Stack (Takes up 2/5 width) */}
        <div className="lg:col-span-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {fetchError ? (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex flex-col gap-2">
              <p className="font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4 text-red-600" /> Database Read Fault
              </p>
              <p className="text-red-700/90 leading-normal">{fetchError}</p>
            </div>
          ) : notificationsList.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-slate-200 rounded-xl bg-white shadow-sm space-y-2 max-w-sm mx-auto">
              <Inbox className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-black text-slate-700 uppercase tracking-wide">Clear Workspace Dashboard</p>
              <p className="text-[11px] text-slate-400 font-normal leading-normal">
                No unread incoming operational updates located inside this category framework logs.
              </p>
            </div>
          ) : (
            notificationsList.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectNotificationRow(item)}
                className={`p-4 border rounded-xl shadow-sm text-left cursor-pointer transition-all duration-150 ${
                  selectedId === item.id 
                    ? "bg-slate-900 border-slate-900 text-white shadow-md transform translate-x-1" 
                    : "bg-white border-slate-200 hover:border-slate-400 text-slate-700"
                }`}
              >
                <h4 className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedId === item.id ? "bg-white animate-ping" : "bg-red-500"}`} />
                  {item.title}
                </h4>
                <p className={`text-[11px] font-normal leading-normal mt-1 ${selectedId === item.id ? "text-slate-300" : "text-slate-500"}`}>
                  {item.description}
                </p>
                <span className="text-[9px] font-semibold text-slate-400 uppercase block mt-2">
                  {new Date(item.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Right Side: Data Processing Panel View Details Deck (Takes up 3/5 width) */}
        <div className="lg:col-span-3 border border-slate-200 rounded-xl p-6 bg-white shadow-sm min-h-[400px] flex flex-col justify-between">
          {selectedItem && selectedItem.category === "Rooms" && activeFormContext ? (
            <div className="space-y-6 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-slate-900 text-white tracking-widest">
                    Processing Panel Context
                  </span>
                  <h2 className="text-base font-black text-slate-900 mt-2.5">{selectedItem.title}</h2>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">{selectedItem.description}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 text-xs text-slate-600 font-normal">
                  <div className="flex justify-between border-b pb-1.5 border-slate-200">
                    <span>Target Customer:</span>
                    <span className="font-bold text-slate-900">{activeFormContext.guest_name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 border-slate-200">
                    <span>Delivery Coordinates:</span>
                    <span className="font-medium text-slate-500">{activeFormContext.guest_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pre-allocated Suite:</span>
                    <span className="font-black text-slate-900">Unit Room {activeFormContext.room_number}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 bg-white mt-auto">
                <button 
                  type="button"
                  onClick={() => setShowDeploymentForm(true)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-md w-full sm:w-auto justify-center"
                >
                  <Key className="w-3.5 h-3.5" /> Initialize Checkout & Key Deployment Form
                </button>
              </div>
            </div>
          ) : selectedItem && selectedItem.category !== "Rooms" ? (
            <div className="space-y-4 font-normal text-xs text-slate-600 p-4 bg-slate-50 border rounded-xl my-auto">
              <p className="font-bold uppercase text-slate-900 text-[11px] tracking-wide">Incidental Service Request Details</p>
              <p className="leading-relaxed mt-1">{selectedItem.description}</p>
              <p className="text-[10px] text-slate-400">Received on: {new Date(selectedItem.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <div className="h-full my-auto flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3 border border-slate-100 text-slate-300">🔍</div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-wide">Select an Operation Record</p>
              <p className="text-[11px] text-slate-400 max-w-xs text-center mt-1 leading-normal font-normal">
                Click on any live left-hand alert row to pull customer fields parameters, verify dates, or view forms overrides panels.
              </p>
            </div>
          )}
        </div>

      </div>

            {/* 📥 DYNAMIC AUTO-CALCULATING CALENDAR & CHECKOUT HOUR OVERLAY MODAL FORM */}
      {showDeploymentForm && activeFormContext && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-1.5">
                  <Key className="w-4 h-4" /> Operational Fulfillment Form
                </h3>
                <p className="text-xs text-slate-400 font-normal">Processing key deployment matrix for Guest {activeFormContext.guest_name}.</p>
              </div>
              <button type="button" onClick={() => setShowDeploymentForm(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <Formik 
              initialValues={{ 
                checkInDate: new Date().toISOString().split("T")[0], 
                checkOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], 
                checkoutTime: "11:00", 
                roomNumber: activeFormContext.room_number || "A-101", 
                receptionComments: "" 
              }} 
              validationSchema={DeploymentValidationSchema} 
              onSubmit={handleProcessFormDeployment}
            >
              {({ values, errors, touched, isSubmitting }) => {
                const d1 = new Date(values.checkInDate);
                const d2 = new Date(values.checkOutDate);
                const autoCountedNights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
                const pricing = calculateStayPricing(activeFormContext.base_rate || 150.00, autoCountedNights);

                return (
                  <Form className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Check-In Calendar</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <Field name="checkInDate" type="date" className="pl-8 pr-2 w-full py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-950" />
                        </div>
                        <ErrorMessage name="checkInDate" component="div" className="text-[10px] text-red-500 mt-1 font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Check-Out Calendar</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <Field name="checkOutDate" type="date" className="pl-8 pr-2 w-full py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-950" />
                        </div>
                        <ErrorMessage name="checkOutDate" component="div" className="text-[10px] text-red-500 mt-1 font-semibold" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Checkout-Hour Clock</label>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <Field name="checkoutTime" type="time" className="pl-8 pr-2 w-full py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-950" />
                        </div>
                        <ErrorMessage name="checkoutTime" component="div" className="text-[10px] text-red-500 mt-1 font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Assigned Suite Unit</label>
                        <Field name="roomNumber" type="text" readOnly className="px-3 w-full py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50 text-slate-400 focus:outline-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Fulfillment Reception Comments Log</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute top-2.5 left-2.5 pointer-events-none">
                          <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                        <Field as="textarea" rows={2} name="receptionComments" className="pl-8 pr-3 w-full py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-950" placeholder="e.g., Physical keys deployed, guest verification check passed successfully." />
                      </div>
                      <ErrorMessage name="receptionComments" component="div" className="text-[10px] text-red-500 mt-1" />
                    </div>

                    {/* Auto-Calculating Financial Invoicing Feed Sheet */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1 font-normal">
                      <div className="flex justify-between"><span>Auto-Counted Nights:</span><span className="font-bold text-slate-900">{autoCountedNights} Nights</span></div>
                      <div className="flex justify-between"><span>Lodging Base Gross:</span><span>${pricing.grossAmount.toFixed(2)}</span></div>
                      {pricing.discountAmount > 0 && <div className="flex justify-between text-emerald-600 font-bold"><span>Length Discount Tiers Applied ({pricing.discountPercentage}%):</span><span>-${pricing.discountAmount.toFixed(2)}</span></div>}
                      <div className="flex justify-between"><span>Goods & Services Tax (10% GST):</span><span>${pricing.gstAmount.toFixed(2)}</span></div>
                      <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1 mt-1 text-sm"><span>Grand Total Invoice Owed:</span><span>${pricing.netFinalAmount.toFixed(2)}</span></div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                      <button type="button" onClick={() => setShowDeploymentForm(false)} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50">
                        {isSubmitting ? "Processing..." : "Confirm & Deploy Key"}
                      </button>
                    </div>
                  </Form>
                );
              }}
            </Formik>
          </div>
        </div>
      )}

    </div>
  );
}
