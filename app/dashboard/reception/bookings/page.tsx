"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { calculateStayPricing } from "@/lib/utils/pricing";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { 
  BedDouble, 
  RefreshCw, 
  X, 
  UserPlus, 
  Key, 
  Calendar, 
  Clock, 
  MessageSquare, 
  CheckCircle2, 
  AlertTriangle,
  Lock
} from "lucide-react";

interface RoomAsset {
  id: string;
  room_number: string;
  room_type: string;
  base_rate: number;
  status: "Vacant" | "Occupied" | "Pre-Booked" | "Under Maintenance" | "Not Applicable";
}

interface ReceptionistPermissions {
  manageOnlineBookings: boolean;
  manageOfflineBookings: boolean;
  handlePayLater: boolean;
  handleDiscounts: boolean;
  handleMealOrders: boolean;
  handleRoomService: boolean;
  generateFinancialReports: boolean;
  hasRoomReservationRights: boolean;
}

interface PageProps {
  srsPermissions?: ReceptionistPermissions;
}

/**
 * Marakale Front-Desk Room Allocation Grid Workspace
 * Location: app/dashboard/reception/bookings/page.tsx
 * Dynamic Version: Strictly respects global Admin feature tokens passed as props.
 */
export default function RoomAllocationTablePage({ srsPermissions }: PageProps) {
  const [roomsGrid, setRoomsGrid] = useState<RoomAsset[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [targetWalkInRoom, setTargetWalkInRoom] = useState<RoomAsset | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const loadRoomInventoryMatrix = async () => {
    setIsRefreshing(true);
    setErrorLog(null);
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number", { ascending: true });

      if (error) throw error;
      setRoomsGrid((data as RoomAsset[]) || []);
    } catch (err: any) {
      setErrorLog(err.message || "Failed to synchronize operational room footprints.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoomInventoryMatrix();
  }, []);

  const handleOpenWalkInForm = (room: RoomAsset) => {
    // SRS ENFORCEMENT: Block booking rights if disabled by Admin
    if (srsPermissions && !srsPermissions.hasRoomReservationRights) {
      alert("Action Denied: Your administrative privilege to allocate rooms has been disabled.");
      return;
    }
    if (room.status !== "Vacant") return;
    setSuccessBanner(null);
    setTargetWalkInRoom(room);
    setShowWalkInModal(true);
  };

  const WalkInValidationSchema = Yup.object().shape({
    guestName: Yup.string().required("Guest name is mandatory for counter booking registries."),
    guestEmail: Yup.string().email("Invalid email layout context.").required("Contact email address is required."),
    checkInDate: Yup.string().required("Select an offline arrival date."),
    checkOutDate: Yup.string().required("Select a targeted departure date."),
    checkoutTime: Yup.string().required("Specify targeted checkout hour clock."),
    receptionComments: Yup.string().required("Input desk comment summary parameters before check-in validation."),
  });

  const handleExecuteOfflineBooking = async (values: any, { resetForm, setSubmitting }: any) => {
    if (!targetWalkInRoom) return;
    setErrorLog(null);

    const start = new Date(values.checkInDate);
    const end = new Date(values.checkOutDate);
    const computedDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Dynamic Pricing Switch: Force 0 discount if Admin toggle is disabled
    const allowDiscounts = srsPermissions ? srsPermissions.handleDiscounts : true;
    const pricing = calculateStayPricing(targetWalkInRoom.base_rate, computedDays);
    const activeDiscountAmount = allowDiscounts ? pricing.discountAmount : 0;
    const finalCalculatedNet = pricing.grossAmount - activeDiscountAmount + pricing.gstAmount;

    try {
      const response = await fetch("/api/reception/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: values.guestName,
          guestEmail: values.guestEmail,
          checkInDate: values.checkInDate,
          checkOutDate: values.checkOutDate,
          checkoutTime: values.checkoutTime,
          roomId: targetWalkInRoom.id,
          computedDays: computedDays,
          baseAmount: pricing.grossAmount,
          discountAmount: activeDiscountAmount,
          gstAmount: pricing.gstAmount,
          netAmount: finalCalculatedNet
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || "Server route rejected walk-in stream.");

      setSuccessBanner(`Walk-in complete! Suite Room ${targetWalkInRoom.room_number} is now occupied by ${values.guestName}.`);
      setShowWalkInModal(false);
      setTargetWalkInRoom(null);
      resetForm();
      loadRoomInventoryMatrix();
    } catch (err: any) {
      console.error(err);
      setErrorLog(err.message || "Bypassing security policy failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRooms = selectedFilter === "All" ? roomsGrid : roomsGrid.filter((r) => r.room_type === selectedFilter);
  const distinctRoomTypes = ["All", ...Array.from(new Set(roomsGrid.map((r) => r.room_type)))];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 antialiased text-slate-800">
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Room Allocation Table</h1>
          {srsPermissions && !srsPermissions.hasRoomReservationRights ? (
            <p className="text-xs text-red-600 font-bold flex items-center gap-1 mt-0.5">
              <Lock className="w-3.5 h-3.5" /> Room assignment features are currently locked by the Administrator.
            </p>
          ) : (
            <p className="text-xs text-slate-500 font-normal mt-0.5">Supervise live room tracking matrices. Click any Vacant unit card tile to register an offline walk-in customer.</p>
          )}
        </div>
        <button onClick={loadRoomInventoryMatrix} disabled={isRefreshing} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm"><RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh Grid</button>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-scale-up">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successBanner}</span>
        </div>
      )}

      {errorLog && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-medium flex items-start gap-2 max-w-xl">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Walk-In Execution Failure</p>
            <p className="text-red-700 mt-0.5">{errorLog}</p>
          </div>
        </div>
      )}

      {/* Filter Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
        {distinctRoomTypes.map((tier) => (
          <button key={tier} onClick={() => setSelectedFilter(tier)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedFilter === tier ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"}`}>{tier}</button>
        ))}
      </div>

            {/* Central Grid Rendering */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredRooms.map((room) => (
          <div 
            key={room.id} 
            onClick={() => handleOpenWalkInForm(room)}
            className={`border border-slate-200 rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 bg-white ${
              room.status === "Vacant" && (!srsPermissions || srsPermissions.hasRoomReservationRights)
                ? "cursor-pointer hover:border-slate-900 hover:shadow-md border-l-4 border-l-emerald-500" 
                : "opacity-60 border-l-4 cursor-not-allowed " + (room.status === "Occupied" ? "border-l-red-500" : "border-l-amber-500")
            }`}
          >
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-black text-slate-900 tracking-tight">Unit {room.room_number}</span>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold tracking-wide border ${room.status === "Vacant" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : room.status === "Occupied" ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>{room.status}</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{room.room_type}</p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400">{room.status === "Vacant" ? "⚡ Click to Book" : "Base Rate:"}</span>
              <span className="font-black text-slate-900">${Number(room.base_rate).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 📥 OFFLINE WALK-IN MANUAL COUNTER FORM OVERLAY MODAL */}
      {showWalkInModal && targetWalkInRoom && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5">
            <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900 uppercase flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Offline Registration Form</h3>
                <p className="text-xs text-slate-400 font-normal">Processing live walk-in entry for Room Unit {targetWalkInRoom.room_number}.</p>
              </div>
              <button type="button" onClick={() => { setShowWalkInModal(false); setTargetWalkInRoom(null); }} className="text-slate-400 hover:text-slate-900"><X className="w-4 h-4" /></button>
            </div>

            <Formik 
              initialValues={{ 
                guestName: "", 
                guestEmail: "", 
                checkInDate: new Date().toISOString().split("T")[0], 
                checkOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], 
                checkoutTime: "11:00",
                receptionComments: ""
              }} 
              validationSchema={WalkInValidationSchema} 
              onSubmit={handleExecuteOfflineBooking}
            >
              {({ values, errors, touched, isSubmitting }) => {
                const d1 = new Date(values.checkInDate);
                const d2 = new Date(values.checkOutDate);
                const autoCountedNights = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
                
                // Read discount rules context dynamically
                const allowDiscounts = srsPermissions ? srsPermissions.handleDiscounts : true;
                const pricing = calculateStayPricing(targetWalkInRoom.base_rate, autoCountedNights);
                const displayedDiscount = allowDiscounts ? pricing.discountAmount : 0;
                const finalBillOwed = pricing.grossAmount - displayedDiscount + pricing.gstAmount;

                return (
                  <Form className="space-y-4">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Full Guest Name</label>
                        <Field name="guestName" type="text" className={`w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900 ${errors.guestName && touched.guestName ? "border-red-400" : "border-slate-200"}`} placeholder="Customer Full Name" />
                        <ErrorMessage name="guestName" component="div" className="text-[10px] text-red-500 mt-1 font-semibold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Contact Email Coordinates</label>
                        <Field name="guestEmail" type="email" className={`w-full px-3 py-2 border rounded-lg text-xs bg-white text-slate-900 ${errors.guestEmail && touched.guestEmail ? "border-red-400" : "border-slate-200"}`} placeholder="guest.contact@gmail.com" />
                        <ErrorMessage name="guestEmail" component="div" className="text-[10px] text-red-500 mt-1 font-semibold" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Check-In Date</label>
                          <Field name="checkInDate" type="date" className="w-full py-1.5 border border-slate-200 px-2 rounded-lg text-xs font-bold bg-white text-slate-900 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Check-Out Date</label>
                          <Field name="checkOutDate" type="date" className="w-full py-1.5 border border-slate-200 px-2 rounded-lg text-xs font-bold bg-white text-slate-900 focus:outline-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Checkout Time Clock</label>
                          <Field name="checkoutTime" type="time" className="w-full py-1.5 border border-slate-200 px-2 rounded-lg text-xs font-bold bg-white text-slate-900 focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Assigned Suite</label>
                          <input type="text" readOnly value={`Room ${targetWalkInRoom.room_number}`} className="px-3 w-full py-1.5 border border-slate-200 bg-slate-50 text-slate-400 rounded-lg text-xs font-bold focus:outline-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-1">Fulfillment Reception Comments Log</label>
                        <Field as="textarea" rows={2} name="receptionComments" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-900 focus:outline-none" placeholder="e.g., Verified ID parameters." />
                        <ErrorMessage name="receptionComments" component="div" className="text-[10px] text-red-500 mt-1 font-semibold" />
                      </div>
                    </div>

                    {/* Auto-Calculating Price Summary Block */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1 font-normal">
                      <div className="flex justify-between"><span>Auto-Counted Duration:</span><span className="font-bold text-slate-900">{autoCountedNights} Nights</span></div>
                      <div className="flex justify-between"><span>Base Lodging Gross:</span><span>${pricing.grossAmount.toFixed(2)}</span></div>
                      
                      {/* DYNAMIC SRS RENDER: Hide discount rows entirely if disabled by Admin query */}
                      {allowDiscounts && pricing.discountAmount > 0 ? (
                        <div className="flex justify-between text-emerald-600 font-bold"><span>Automated Discount Tiers Applied ({pricing.discountPercentage}%):</span><span>-${pricing.discountAmount.toFixed(2)}</span></div>
                      ) : !allowDiscounts ? (
                        <div className="flex justify-between text-amber-600 font-semibold italic"><span>Discounts:</span><span>Disabled by Admin</span></div>
                      ) : null}

                      <div className="flex justify-between"><span>Goods & Services Tax (10% GST):</span><span>${pricing.gstAmount.toFixed(2)}</span></div>
                      <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1 mt-1 text-sm"><span>Grand Total Owed:</span><span>${finalBillOwed.toFixed(2)}</span></div>
                    </div>

                                        {/* DYNAMIC SRS ACTION ENFORCEMENT */}
                    {srsPermissions && !srsPermissions.handlePayLater ? (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[10px] text-amber-800 flex flex-col gap-1 font-normal leading-normal">
                        <span className="font-bold uppercase tracking-wider flex items-center gap-1"><Lock className="w-3 h-3" /> Upfront Payment Enforced</span>
                        <span>"Pay Later" features are disabled. Receptionist must collect the full balance of <strong>${finalBillOwed.toFixed(2)}</strong> immediately at the counter before completing check-in.</span>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2.5 text-[10px] text-emerald-800 leading-normal flex items-start gap-1.5 font-normal">
                        <span>Bypasses reservation queues and writes records live. Payment deferrals enabled.</span>
                      </div>
                    )}

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                      <button type="button" onClick={() => { setShowWalkInModal(false); setTargetWalkInRoom(null); }} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50">
                        {isSubmitting ? "Processing..." : "Complete Checkout & Check-In"}
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
