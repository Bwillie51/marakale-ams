"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { calculateStayPricing } from "@/lib/utils/pricing";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { 
  Bed, 
  Calendar, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle,
  User,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Timer
} from "lucide-react";

interface VacantRoomItem {
  id: string;
  room_number: string;
  room_type: string;
  base_rate: number;
  status: string;
}

/**
 * Marakale Pre-Check-In Multi-Room Reservation Slate
 * Location: app/portal/pre-book/page.tsx
 */
export default function PreCheckInBookingSlate() {
  const router = useRouter();
  const [vacantRooms, setVacantRooms] = useState<VacantRoomItem[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [guestEmail, setGuestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [successMsg, setSuccessBanner] = useState<string | null>(null);

  useEffect(() => {
    const initializePortalSession = async () => {
      setIsLoading(true);
      setErrorLog(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const activeEmail = sessionData?.session?.user?.email || "guest.walkin@example.com";
        setGuestEmail(activeEmail);

        const { data: historicalCheck } = await supabase
          .from("reservations")
          .select("id, status, created_at")
          .eq("guest_email", activeEmail)
          .eq("status", "Pending")
          .single();

        if (historicalCheck) {
          const recordAgeMs = Date.now() - new Date(historicalCheck.created_at).getTime();
          if (recordAgeMs < 24 * 60 * 60 * 1000) {
            setErrorLog("Access Restricted: You already hold an active 24-hour room block reservation. Please present yourself at the physical counter reception desk to verify credentials.");
            return;
          }
        }

        const { data: rooms } = await supabase
          .from("rooms")
          .select("*")
          .eq("status", "Vacant")
          .order("room_number", { ascending: true });

        if (rooms) setVacantRooms(rooms as VacantRoomItem[]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    initializePortalSession();
  }, [successMsg]);

  const handleToggleSelectRoomRow = (roomId: string) => {
    setSelectedRoomIds((prev) => 
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const PreBookValidationSchema = Yup.object().shape({
    guestName: Yup.string().required("Input your full name to proceed."),
    checkInDate: Yup.string().required("Select arrival date."),
    checkOutDate: Yup.string().required("Select departure date."),
    checkoutTime: Yup.string().required("Specify targeted checkout hour."),
  });

  const handleCommitPreBookingHold = async (values: any, { setSubmitting }: any) => {
    if (selectedRoomIds.length === 0) {
      alert("Please select at least one vacant room suite from the selection matrix grid.");
      setSubmitting(false);
      return;
    }

    const start = new Date(values.checkInDate);
    const end = new Date(values.checkOutDate);
    const autoCountedNights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    let combinedNetBill = 0;
    selectedRoomIds.forEach(id => {
      const room = vacantRooms.find(r => r.id === id);
      if (room) {
        const pricing = calculateStayPricing(room.base_rate, autoCountedNights);
        combinedNetBill += pricing.netFinalAmount;
      }
    });

    try {
      const response = await fetch("/api/reception/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: values.guestName,
          guestEmail: guestEmail,
          checkInDate: values.checkInDate,
          checkOutDate: values.checkOutDate,
          checkoutTime: values.checkoutTime,
          roomId: selectedRoomIds, 
          computedDays: autoCountedNights,
          baseAmount: combinedNetBill * 0.9,
          discountAmount: 0,
          gstAmount: combinedNetBill * 0.1,
          netAmount: combinedNetBill
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || "Failed hold processing.");

      for (const extraId of selectedRoomIds) {
        await supabase.from("rooms").update({ status: "Pre-Booked" }).eq("id", extraId);
        
        await supabase.from("system_notifications").insert({
          category: "Rooms",
          title: `Online Hold Filed: Room B-201`,
          description: `${values.guestName} holds ${selectedRoomIds.length} rooms via online OTP. Verification required at counter within 24 hours.`,
          is_read: false,
          target_id: result.reservationId || "res-uuid"
        });
      }

      setSuccessBanner(`Hold processed successfully! We have locked your selected suites for exactly 24 hours. Your access email is now suspended from code requests until verified at the front desk.`);
      setSelectedRoomIds([]);
    } catch (err: any) {
      console.error(err);
      setErrorLog(err.message || "Relational table collision.");
    } finally {
      setSubmitting(false);
    }
  };

  if (errorLog) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center select-none antialiased">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mx-auto"><AlertTriangle className="w-5 h-5 animate-pulse" /></div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Authentication Locked</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-normal">{errorLog}</p>
          <button onClick={() => router.push("/login")} className="w-full py-2.5 bg-white text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider font-bold">Return to Access Gate</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 antialiased select-none">
      
      <header className="max-w-6xl mx-auto flex justify-between items-center bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden mb-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-slate-700 to-indigo-400" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center"><User className="w-5 h-5 text-blue-400" /></div>
          <div>
            <h1 className="text-sm font-black uppercase text-white tracking-wider">Online Reservation Workspace</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Active Session Email: <span className="text-white">{guestEmail}</span></p>
          </div>
        </div>
        {/* FIXED: Bound the correctly imported icon object reference here */}
        <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all"><LogOut className="w-4 h-4" /></button>
      </header>

      {successMsg && (
        <div className="max-w-6xl mx-auto mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 rounded-xl flex items-start gap-2 shadow-sm leading-relaxed animate-scale-up">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-slate-500 tracking-wider pl-1">
            <Bed className="w-4 h-4" />
            <span>Currently Vacant Luxury Suites Available ({vacantRooms.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {vacantRooms.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center text-slate-500 col-span-full">
                <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                <p className="text-xs font-black uppercase text-slate-400">All Suites Allocated</p>
                <p className="text-[10px] font-normal mt-0.5">Please coordinate directly with the front counter reception desk for physical counter walk-in scheduling.</p>
              </div>
            ) : (
              vacantRooms.map((room) => {
                const isChecked = selectedRoomIds.includes(room.id);
                return (
                                    <div 
                    key={room.id}
                    onClick={() => handleToggleSelectRoomRow(room.id)}
                    className={`p-5 border rounded-2xl shadow-xl flex flex-col justify-between space-y-4 cursor-pointer transition-all duration-150 ${
                      isChecked 
                        ? "bg-slate-900 border-blue-500 text-white ring-1 ring-blue-500/30 transform scale-[1.01]" 
                        : "bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black uppercase text-white tracking-tight">Suite Unit {room.room_number}</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{room.room_type}</p>
                      </div>
                      <input 
                        type="checkbox" 
                        readOnly 
                        checked={isChecked} 
                        className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0 cursor-pointer" 
                      />
                    </div>
                    <div className="pt-3 border-t border-slate-800/60 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Standard Base Rate:</span>
                      <span className="font-black text-white">${Number(room.base_rate).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COMPONENT COLUMN: AUTO-CALCULATING CALENDAR HOLD FORM (Takes 2/5 width) */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
          <div className="border-b border-slate-800/60 pb-3 mb-4">
            <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Execute Hold Parameters</h3>
            <p className="text-[11px] text-slate-500 font-normal leading-relaxed mt-0.5">Define your stay length requirements below. Pricing details calculate instantly on field mutations.</p>
          </div>

          <Formik
            initialValues={{ 
              guestName: "", 
              checkInDate: new Date().toISOString().split("T")[0], 
              checkOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], 
              checkoutTime: "11:00" 
            }}
            validationSchema={PreBookValidationSchema}
            onSubmit={handleCommitPreBookingHold}
          >
            {({ values, errors, touched, isSubmitting }) => {
              const d1 = new Date(values.checkInDate);
              const d2 = new Date(values.checkOutDate);
              const nightsCount = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));

              let grossSum = 0;
              let discountSum = 0;
              let gstSum = 0;
              let grandTotalSum = 0;

              selectedRoomIds.forEach(id => {
                const room = vacantRooms.find(r => r.id === id);
                if (room) {
                  const pricing = calculateStayPricing(room.base_rate, nightsCount);
                  grossSum += pricing.grossAmount;
                  discountSum += pricing.discountAmount;
                  gstSum += pricing.gstAmount;
                  grandTotalSum += pricing.netFinalAmount;
                }
              });

              return (
                <Form className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Your Full Name</label>
                    <Field required name="guestName" type="text" className="block w-full py-2 px-3 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl focus:outline-none placeholder-slate-700" placeholder="Jane Doe" />
                    <ErrorMessage name="guestName" component="div" className="text-[10px] text-red-400 mt-1 font-semibold" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Check-In Calendar</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none"><Calendar className="h-3.5 w-3.5 text-slate-500" /></div>
                        <Field required name="checkInDate" type="date" className="block w-full py-1.5 pl-8 pr-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg focus:outline-none font-bold" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Check-Out Calendar</label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none"><Calendar className="h-3.5 w-3.5 text-slate-500" /></div>
                        <Field required name="checkOutDate" type="date" className="block w-full py-1.5 pl-8 pr-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg focus:outline-none font-bold" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Checkout Deadline Hour Clock</label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none"><Clock className="h-3.5 w-3.5 text-slate-500" /></div>
                      <Field required name="checkoutTime" type="time" className="block w-full py-1.5 pl-8 pr-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg focus:outline-none font-bold" />
                    </div>
                    <ErrorMessage name="checkoutTime" component="div" className="text-[10px] text-red-400 mt-1 font-semibold" />
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5 font-normal">
                    <div className="flex justify-between"><span>Selected Suite Count:</span><span className="font-bold text-white">{selectedRoomIds.length} Units Selected</span></div>
                    <div className="flex justify-between"><span>Auto-Calculated Nights:</span><span className="font-bold text-white">{nightsCount} Nights Stay</span></div>
                    <div className="flex justify-between border-t border-slate-800/40 pt-1.5 mt-1.5"><span>Accommodations Gross Subtotal:</span><span className="text-slate-200">${grossSum.toFixed(2)}</span></div>
                    {discountSum > 0 && <div className="flex justify-between text-emerald-400 font-bold"><span>Automated Multi-Night Special:</span><span>-${discountSum.toFixed(2)}</span></div>}
                    <div className="flex justify-between"><span>Goods & Services Tax (10% GST):</span><span className="text-slate-200">${gstSum.toFixed(2)}</span></div>
                    <div className="flex justify-between font-black text-white border-t border-slate-800 pt-1.5 mt-1.5 text-sm"><span>Grand Total Booking Invoice:</span><span className="text-emerald-400">${grandTotalSum.toFixed(2)}</span></div>
                  </div>

                  <div className="rounded-xl bg-blue-950/20 border border-blue-900/40 p-3 text-[10px] text-slate-400 leading-relaxed font-normal flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>Clicking hold changes selected rooms state to <strong>Pre-Booked</strong> for exactly 24 hours. Your email token access drops instantly, blocking code resubmissions until counter finalization routines run.</span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || selectedRoomIds.length === 0} 
                    className="w-full py-3 bg-white text-slate-950 hover:bg-slate-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 font-bold shadow-lg"
                  >
                    {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <>Request 24-Hour Room Hold <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>

    </div>
  );
}
