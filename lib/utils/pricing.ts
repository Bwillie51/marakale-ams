export interface PricingBreakdown {
  baseRatePerNight: number;
  totalStayDays: number;
  grossAmount: number;
  discountPercentage: number;
  discountAmount: number;
  gstAmount: number;
  netFinalAmount: number;
}

/**
 * Calculates the total cost of a stay with automated discount application
 * Tiers: 
 * - 1 to 3 days: Normal standard price (0%)
 * - More than 3 days: 5% discount
 * - More than 7 days: 12% discount
 * - More than 14 days: 20% discount
 */
export function calculateStayPricing(baseRatePerNight: number, totalStayDays: number): PricingBreakdown {
  if (totalStayDays <= 0) {
    return {
      baseRatePerNight,
      totalStayDays: 0,
      grossAmount: 0,
      discountPercentage: 0,
      discountAmount: 0,
      gstAmount: 0,
      netFinalAmount: 0
    };
  }

  const grossAmount = baseRatePerNight * totalStayDays;
  let discountPercentage = 0;

  // Strict structural system discount matrix evaluated chronologically
  if (totalStayDays > 14) {
    discountPercentage = 20;
  } else if (totalStayDays > 7) {
    discountPercentage = 12;
  } else if (totalStayDays > 3) {
    discountPercentage = 5;
  }

  const discountAmount = Math.round((grossAmount * (discountPercentage / 100)) * 100) / 100;
  const amountAfterDiscount = grossAmount - discountAmount;
  
  // 10% Standard Goods and Services Tax (GST) addition calculations
  const gstAmount = Math.round((amountAfterDiscount * 0.10) * 100) / 100;
  const netFinalAmount = Math.round((amountAfterDiscount + gstAmount) * 100) / 100;

  return {
    baseRatePerNight,
    totalStayDays,
    grossAmount,
    discountPercentage,
    discountAmount,
    gstAmount,
    netFinalAmount
  };
}
