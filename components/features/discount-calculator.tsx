import * as React from "react";

interface DiscountCalculatorProps {
  /** The base numeric room rate per night */
  baseRatePerNight: number;
  /** Total calculated nights of stay */
  totalStayDays: number;
}

/**
 * Marakale Automated Discount Pricing & Breakdown Display
 * Dynamically presents structural billing metrics based on length-of-stay thresholds.
 */
export function DiscountCalculator({ baseRatePerNight, totalStayDays }: DiscountCalculatorProps) {
  // Compute numbers cleanly to keep interface rendering consistent
  const grossAmount = baseRatePerNight * totalStayDays;
  
  let discountPercentage = 0;
  if (totalStayDays > 14) {
    discountPercentage = 20;
  } else if (totalStayDays > 7) {
    discountPercentage = 12;
  } else if (totalStayDays > 3) {
    discountPercentage = 5;
  }

  const discountAmount = grossAmount * (discountPercentage / 100);
  const amountAfterDiscount = grossAmount - discountAmount;
  const gstAmount = amountAfterDiscount * 0.10;
  const netFinalAmount = amountAfterDiscount + gstAmount;

  // Format utility for local currency display structures
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  if (totalStayDays <= 0) {
    return <p className="text-sm text-slate-500 italic">Select a valid stay duration to compute pricing metrics.</p>;
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wide">
        Stay Cost Breakdown
      </h3>
      
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Daily Rate:</span>
          <span>{formatCurrency(baseRatePerNight)} / night</span>
        </div>
        
        <div className="flex justify-between text-slate-600">
          <span>Total Stay Duration:</span>
          <span>{totalStayDays} {totalStayDays === 1 ? "day" : "days"}</span>
        </div>
        
        <div className="flex justify-between font-medium text-slate-700 pt-1 border-t border-dashed border-slate-100">
          <span>Gross Subtotal:</span>
          <span>{formatCurrency(grossAmount)}</span>
        </div>

        <div className="flex justify-between text-emerald-600 font-medium">
          <span>System Discount ({discountPercentage}%):</span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>

        <div className="flex justify-between text-slate-600">
          <span>GST (10%):</span>
          <span>{formatCurrency(gstAmount)}</span>
        </div>

        <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
          <span>Net Final Total:</span>
          <span>{formatCurrency(netFinalAmount)}</span>
        </div>
      </div>
      
      <div className="rounded bg-slate-50 p-2 text-[11px] text-slate-500 text-center leading-normal border border-slate-100">
        🛡️ Pricing locked by Owner configuration matrix rules. Reception overrides restricted.
      </div>
    </div>
  );
}
