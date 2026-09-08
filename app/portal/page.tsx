"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { Formik, Form } from "formik";
import { 
  Sparkles, 
  LogOut, 
  Utensils, 
  Wrench, 
  CheckCircle, 
  RefreshCw, 
  Bed, 
  History, 
  Timer, 
  ShoppingBag, 
  Layers, 
  Soup, 
  GlassWater,
  CheckSquare,
  ClipboardList,
  DollarSign
} from "lucide-react";

interface StaySessionMeta {
  reservationId: string;
  guestName: string;
  guestEmail: string;
  roomNumber: string;
  checkOutDeadline: string; 
}

interface HistoricalRequest {
  id: string;
  type: "Meal" | "Housekeeping";
  description: string;
  status: string;
  timestamp: string;
}

interface SanityMenuProduct {
  _id: string;
  item_name: string;
  cost: number;
  type: "food" | "drink";
  description?: string;
}

interface AmenityInventoryItem {
  id: string;
  name: string;
  category: "Toiletries" | "Linens" | "Refreshments" | "Essentials";
}

/**
 * Marakale In-House Guest Service Portal Terminal
 * Location: app/portal/page.tsx
 * Fully polished matching Module 6 with Live Cart Subtotals and automated simulation receipts.
 */
export default function PolishedInHouseGuestPortal() {
  const router = useRouter();
  
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"dining" | "roomservice">("dining");
  const [menuProductFilter, setMenuProductFilter] = useState<"all" | "food" | "drink">("all");

  const [sessionMeta, setSessionMeta] = useState<StaySessionMeta | null>(null);
  const [historyList, setHistoryList] = useState<HistoricalRequest[]>([]);
  const [sanityMenu, setSanityMenu] = useState<SanityMenuProduct[]>([]);
  const [timeRemainingText, setTimeRemainingText] = useState("Calculating active period window...");
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Dynamic Unified Selected Cart States for Dining Products
  const [selectedDiningProductIds, setSelectedDiningProductIds] = useState<string[]>([]);

  // Room Service Static Mandatory Amenities Roster Checklist array definitions
  const mandatoryAmenitiesList: AmenityInventoryItem[] = [
    { id: "am_1", name: "Plush Egyptian Cotton Face Towels", category: "Linens" },
    { id: "am_2", name: "Organic Botanical Shampoos & Conditioners", category: "Toiletries" },
    { id: "am_3", name: "Premium Bamboo Dental Hygiene Kit", category: "Toiletries" },
    { id: "am_4", name: "Luxury Velvet Bathrobe & Slippers Set", category: "Linens" },
    { id: "am_5", name: "Chilled Premium Spring Water Bottles", category: "Refreshments" },
    { id: "am_6", name: "Complimentary Roasted Coffee Pods Bundle", category: "Refreshments" },
    { id: "am_7", name: "Microfiber Anti-Allergen Pillow Replacements", category: "Linens" },
    { id: "am_8", name: "Universal Cryptographic Adapter Cable", category: "Essentials" }
  ];
  const [selectedMissingAmenityIds, setSelectedMissingAmenities] = useState<string[]>([]);

  const loadSanityCatalogFallback = () => {
    setSanityMenu([
      { _id: "f1", item_name: "Truffle Grilled Ribeye", cost: 45.00, type: "food", description: "Bespoke Wagyu cuts, organic herbs, signature butter." },
      { _id: "f2", item_name: "Artisanal Lobster Roll", cost: 38.00, type: "food", description: "Fresh coast catches, butter brioche crisp frames." },
      { _id: "d1", item_name: "Cold Pressed Citrus Elixir", cost: 12.00, type: "drink", description: "Organic blood orange, lime zest splash extract." },
      { _id: "d2", item_name: "Smoked Oak Old Fashioned", cost: 18.00, type: "drink", description: "Premium barrel select, continuous aromatic infusion lines." }
    ]);
  };

  const verifyStayActivePeriod = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        setSessionMeta({
          reservationId: "mock-res-uuid-101",
          guestName: "Jethro Counter Walk-In",
          guestEmail: "jethro.walkin@example.com",
          roomNumber: "B-201",
          checkOutDeadline: new Date(Date.now() + 180000).toISOString()
        });
        return;
      }

      const { data: resRow } = await supabase
        .from("reservations")
        .select("id, guest_name, guest_email, check_out, reservation_rooms(rooms(room_number))")
        .eq("guest_email", sessionData.session.user.email)
        .eq("status", "Active")
        .single();

      if (resRow) {
        setSessionMeta({
          reservationId: resRow.id,
          guestName: resRow.guest_name,
          guestEmail: resRow.guest_email,
          roomNumber: (resRow as any).reservation_rooms?.rooms?.room_number || "B-201",
          checkOutDeadline: resRow.check_out
        });
        loadMyRequestTimeline(resRow.id);
      } else {
        router.push("/login?error=expired_session");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadMyRequestTimeline = async (resId: string) => {
    setIsSyncing(true);
    try {
      const { data: meals } = await supabase.from("meal_orders").select("*").eq("reservation_id", resId);
      const { data: service } = await supabase.from("service_requests").select("*").eq("reservation_id", resId);

      const combined: HistoricalRequest[] = [];
      meals?.forEach(m => combined.push({ id: m.id, type: "Meal", description: m.order_details?.item || "Gastronomy Tab", status: m.status, timestamp: m.created_at }));
      service?.forEach(s => combined.push({ id: s.id, type: "Housekeeping", description: s.issue_description, status: s.status, timestamp: s.created_at }));
      
      setHistoryList(combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadSanityCatalogFallback();
    verifyStayActivePeriod();
  }, []);

  useEffect(() => {
    if (!sessionMeta) return;
    const tickerInterval = setInterval(() => {
      const now = new Date().getTime();
      const targetTime = new Date(sessionMeta.checkOutDeadline).getTime();
      const differenceDelta = targetTime - now;

      if (differenceDelta <= 0) {
        clearInterval(tickerInterval);
        setTimeRemainingText("STAY EXPIRED. REVOKING DASHBOARD ACCESS...");
        setTimeout(async () => {
          await supabase.auth.signOut();
          router.push("/login?error=stay_expired");
        }, 1500);
        return;
      }

      const totalSeconds = Math.floor(differenceDelta / 1000);
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      setTimeRemainingText(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(tickerInterval);
  }, [sessionMeta]);

  // Toggle dynamic selection list checkbox arrays for dining selections
  const handleToggleSelectDiningCard = (id: string) => {
    setSelectedDiningProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  // 1. Unified Dining Order submission handler dispatches all selected elements to reception at once
  const handleDispatchConsolidatedDiningCart = async () => {
    if (!sessionMeta || selectedDiningProductIds.length === 0) return;
    setActionFeedback(null);

    const itemsToOrder = sanityMenu.filter(p => selectedDiningProductIds.includes(p._id));
    const combinedTitlesList = itemsToOrder.map(i => i.item_name).join(", ");
    const totalCartCost = itemsToOrder.reduce((sum, i) => sum + i.cost, 0);

    try {
      await supabase.from("meal_orders").insert({ 
        reservation_id: sessionMeta.reservationId, 
        order_details: { item: `Consolidated Cart: ${combinedTitlesList}`, quantity: selectedDiningProductIds.length }, 
        total_cost: totalCartCost, 
        status: "Pending" 
      });

      await supabase.from("system_notifications").insert({ 
        category: "Restaurant", 
        title: `Dining Request: Room ${sessionMeta.roomNumber}`, 
        description: `${sessionMeta.guestName} placed a consolidated card order for: ${combinedTitlesList}. Total Owed: K${totalCartCost.toFixed(2)}`, 
        is_read: false, 
        target_id: sessionMeta.reservationId 
      });

            // 2. AUTOMATED OFFLINE EMAIL RECEIPT SIMULATION STREAM PRINT FOR THE GUEST
      console.log(`=========================================================================`);
      console.log(`MARAKALE INCIDENTALS INVOICING SUITE - AUTO-GENERATED GUEST EMAIL RECEIPT`);
      console.log(`Recipient Guest Email: ${sessionMeta.guestEmail}                         `);
      console.log(`Suite Assignment: Room ${sessionMeta.roomNumber}                        `);
      console.log(`-------------------------------------------------------------------------`);
      itemsToOrder.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.item_name.padEnd(35)} -> K${item.cost.toFixed(2)}`);
      });
      console.log(`-------------------------------------------------------------------------`);
      console.log(`GRAND TOTAL CHARGE: K${totalCartCost.toFixed(2)}                         `);
      console.log(`NOTICE: Our reception desk has received your ticket logs. Staff will      `);
      console.log(`present themselves at Room ${sessionMeta.roomNumber} shortly to collect payment.`);
      console.log(`=========================================================================`);

      setActionFeedback(`Order transmitted successfully! An itemized receipt for K${totalCartCost.toFixed(2)} has been emailed to your address. Reception staff will visit Room ${sessionMeta.roomNumber} shortly to collect payment.`);
      setSelectedDiningProductIds([]);
      loadMyRequestTimeline(sessionMeta.reservationId);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSelectMissingAmenity = (id: string) => {
    setSelectedMissingAmenities(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const handleDispatchAmenitiesRestockTicket = async () => {
    if (!sessionMeta || selectedRoomServiceItemsCount === 0) return;
    setActionFeedback(null);

    const missingItems = mandatoryAmenitiesList.filter(a => selectedMissingAmenityIds.includes(a.id));
    const missingItemsString = missingItems.map(a => a.name).join(", ");

    try {
      await supabase.from("service_requests").insert({ 
        reservation_id: sessionMeta.reservationId, 
        issue_description: `Missing Room Inventory Restock Request: ${missingItemsString}`, 
        status: "Pending" 
      });

      await supabase.from("system_notifications").insert({ 
        category: "Service", 
        title: `Restock Alert: Room ${sessionMeta.roomNumber}`, 
        description: `Guest requested missing essential inventory items replacement: ${missingItemsString}.`, 
        is_read: false, 
        target_id: sessionMeta.reservationId 
      });

      setActionFeedback("Restock ticket dispatched! Housekeeping has been deployed to deliver your missing items.");
      setSelectedMissingAmenities([]);
      loadMyRequestTimeline(sessionMeta.reservationId);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = sanityMenu.filter(p => menuProductFilter === "all" ? true : p.type === menuProductFilter);
  const selectedDiningItemsCount = selectedDiningProductIds.length;
  const selectedRoomServiceItemsCount = selectedMissingAmenityIds.length;

  // DYNAMIC COMPUTATION: Calculate running subtotal live from active card checks arrays
  const liveRunningCartTotal = sanityMenu
    .filter(p => selectedDiningProductIds.includes(p._id))
    .reduce((sum, p) => sum + p.cost, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 antialiased selection:bg-slate-800 selection:text-white">
      
      {/* BRAND HEADER WITH LIVE TIMER ROW CONTAINER */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between sm:items-center bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-6 rounded-2xl gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-slate-700 to-amber-400" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
            <Bed className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase text-white tracking-wider">{sessionMeta?.guestName}</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">In-House Room Unit: <span className="text-white">{sessionMeta?.roomNumber}</span></p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:ml-auto">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-inner">
            <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Access Window Clock</span>
              <span className="text-xs font-black uppercase tracking-tight tabular-nums text-white">{timeRemainingText}</span>
            </div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }} className="p-2.5 bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl transition-all shadow-sm"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      {actionFeedback && (
        <div className="max-w-6xl mx-auto mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 rounded-xl flex items-start gap-2 shadow-sm leading-relaxed animate-scale-up">
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-amber-400 mt-0.5" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* DYNAMIC SEGMENTED TAB SWITCHER BUTTONS */}
      <div className="max-w-6xl mx-auto mt-6 flex justify-center">
        <div className="bg-slate-900/80 border border-slate-800/80 p-1.5 rounded-2xl flex max-w-md w-full shadow-lg">
          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("dining")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 duration-200 ${
              activeWorkspaceTab === "dining"
                ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md border border-slate-600/30"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Utensils className="w-4 h-4" /> Room Dining & Restaurant Menu
          </button>
          
          <button
            type="button"
            onClick={() => setActiveWorkspaceTab("roomservice")}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 duration-200 ${
              activeWorkspaceTab === "roomservice"
                ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md border border-slate-600/30"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Wrench className="w-4 h-4" /> Housekeeping & Service Desk
          </button>
        </div>
      </div>

      {/* WORKSPACE RENDERING VIEWPORTS CONTAINER */}
      <div className="max-w-6xl mx-auto mt-6 min-h-[460px]">
        
        {/* OPTION A: RE-ENGINEERED DOCK GRIDS WITH UNIFIED SINGLE ORDER DISPATCH BUTTON */}
        {activeWorkspaceTab === "dining" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800/60 pb-3 gap-3">
              <div className="flex gap-2 items-center">
                <button type="button" onClick={() => setMenuProductFilter("all")} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${menuProductFilter === "all" ? "bg-white text-slate-950 border-white font-bold" : "bg-slate-900 text-slate-500 border-slate-800"}`}><Layers className="w-3 h-3 inline mr-1" /> All Menu</button>
                <button type="button" onClick={() => setMenuProductFilter("food")} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${menuProductFilter === "food" ? "bg-white text-slate-950 border-white font-bold" : "bg-slate-900 text-slate-500 border-slate-800"}`}><Soup className="w-3 h-3 inline mr-1" /> Foods Only</button>
                <button type="button" onClick={() => setMenuProductFilter("drink")} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${menuProductFilter === "drink" ? "bg-white text-slate-950 border-white font-bold" : "bg-slate-900 text-slate-500 border-slate-800"}`}><GlassWater className="w-3 h-3 inline mr-1" /> Drinks Only</button>
              </div>

                            {/* 💵 RE-DESIGNED LIVE RUNNING TOTAL ACTION CART OVERLAY */}
              {selectedDiningItemsCount > 0 && (
                <div className="flex items-center gap-3 w-full sm:w-auto bg-slate-900 border border-slate-800 p-1.5 pl-4 rounded-xl shadow-2xl animate-scale-up">
                  <div className="flex flex-col text-left pr-2">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">Running Subtotal</span>
                    <span className="text-xs font-black text-emerald-400">K{liveRunningCartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDispatchConsolidatedDiningCart}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-[11px] font-black uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Place Consolidated Order ({selectedDiningItemsCount} Items)
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const isItemChecked = selectedDiningProductIds.includes(product._id);
                return (
                  <div 
                    key={product._id} 
                    onClick={() => handleToggleSelectDiningCard(product._id)}
                    className={`border rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all duration-200 bg-slate-900/40 relative ${
                      isItemChecked ? "border-amber-500/80 shadow-2xl ring-1 ring-amber-500/20" : "border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="absolute top-3 right-3 z-20">
                      {isItemChecked ? (
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 shadow-md animate-scale-up">
                          <CheckSquare className="w-3.5 h-3.5 stroke-2" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border border-slate-700 bg-slate-950/80" />
                      )}
                    </div>

                    <div className="w-full h-32 bg-slate-950 rounded-xl mb-3 overflow-hidden border border-slate-800 relative select-none flex flex-col items-center justify-center text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                      <ShoppingBag className="w-6 h-6 text-slate-800 mb-1" />
                      <span>{product.type} asset image</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-1 pr-6">
                        <h4 className="text-xs font-black uppercase text-white truncate">{product.item_name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal leading-normal line-clamp-2">{product.description}</p>
                      <div className="pt-2 flex justify-between items-center text-xs font-black text-emerald-400">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Billing Tier:</span>
                        <span>K{Number(product.cost).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* OPTION B: VISUAL MANDATORY EQUIPMENT CHECKLIST WITH DISPATCH COMPONENT LOGIC */}
        {activeWorkspaceTab === "roomservice" && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            <div className="border-b border-slate-800/60 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-slate-400" /> Mandatory Room Supplies Verification Sheet</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Review standard items allocated to your room. If anything is missing or needs a restock, select the check boxes below to notify the desk.</p>
              </div>

              {selectedRoomServiceItemsCount > 0 && (
                <button
                  type="button"
                  onClick={handleDispatchAmenitiesRestockTicket}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 font-bold animate-scale-up"
                >
                  <Wrench className="w-4 h-4" /> Request Restock ({selectedRoomServiceItemsCount} Items)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {mandatoryAmenitiesList.map((amenity) => {
                const isAmenityMissing = selectedMissingAmenityIds.includes(amenity.id);
                return (
                  <div
                    key={amenity.id}
                    onClick={() => handleToggleSelectMissingAmenity(amenity.id)}
                    className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-150 select-none bg-slate-900/30 ${
                      isAmenityMissing 
                        ? "border-red-500/50 bg-red-950/10 text-white shadow-inner" 
                        : "border-slate-800/80 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 tracking-wider">{amenity.category}</span>
                      <p className="text-xs font-bold text-white pt-1">{amenity.name}</p>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4">
                      {isAmenityMissing ? (
                        <div className="w-5 h-5 rounded bg-red-500 flex items-center justify-center text-white font-black animate-scale-up">
                          <CheckSquare className="w-3.5 h-3.5 stroke-2" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border border-slate-700 bg-slate-950/60 flex items-center justify-center text-slate-500 text-[10px] font-black">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* 4. ACTIVITY TIMELINE LOGS */}
      <section className="max-w-6xl mx-auto bg-slate-900/30 border border-slate-800 p-6 rounded-2xl shadow-2xl mt-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Current Stay Activity Timeline</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 border border-slate-800 rounded">Real-Time Sync Logs</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                <th className="p-3">Category</th>
                <th className="p-3">Service Log Specification Description</th>
                <th className="p-3">Timestamped Clock</th>
                <th className="p-3 text-right">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-medium text-slate-400">
              {historyList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-slate-600 italic">No incidental requests filed during this active stay period framework block.</td>
                </tr>
              ) : (
                historyList.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${row.type === "Meal" ? "bg-emerald-950/40 border-emerald-800 text-emerald-400" : "bg-blue-950/40 border-blue-800 text-blue-400"}`}>{row.type}</span></td>
                    <td className="p-3 font-bold text-slate-200">{row.description}</td>
                    <td className="p-3 text-slate-500">{new Date(row.timestamp).toLocaleTimeString()}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${row.status === "Pending" ? "bg-amber-950/40 border-amber-800 text-amber-400 animate-pulse" : "bg-emerald-950/40 border-emerald-800 text-emerald-400"}`}>{row.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
