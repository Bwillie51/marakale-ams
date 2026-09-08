import * as React from "react";

/**
 * Standard Localized Financial Currency Formatter
 * normalizes integers or variable strings into clean dollar output logs.
 * Example: 450 -> $450.00
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "$0.00";
  
  const parsedValue = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(parsedValue)) return "$0.00";
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(parsedValue);
}

/**
 * Enterprise Operational Timestamp Layout Modifier
 * Converts database ISO strings into user-friendly chronological signatures.
 * Example: 2026-08-27T14:39:00Z -> Aug 27, 2026, 2:39 PM
 */
export function formatSystemTimestamp(isoString: string | null | undefined): string {
  if (!isoString) return "N/A";
  
  try {
    const calendarDate = new Date(isoString);
    if (isNaN(calendarDate.getTime())) return "Invalid Date";
    
    return calendarDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  } catch (err) {
    console.error("Timestamp formatting exception encountered:", err);
    return "Format Error";
  }
}

/**
 * Granular Description Truncation Helper
 * Truncates long remarks safely inside list view column containers to preserve layouts.
 */
export function truncateTextText(text: string | null | undefined, maxCharacters: number = 60): string {
  if (!text) return "";
  if (text.length <= maxCharacters) return text;
  return text.substring(0, maxCharacters).trim() + "...";
}

/**
 * Dynamic Status Badge Class Resolver
 * Centralizes UI layout definitions for color matrices across components.
 */
export function getStatusBadgeStyles(status: string): string {
  const normalizedStatus = status?.trim().toLowerCase();
  
  switch (normalizedStatus) {
    case "vacant":
    case "active":
    case "success":
    case "delivered":
      return "bg-emerald-50 border-emerald-200 text-emerald-700 font-extrabold";
    case "occupied":
    case "failed":
    case "seized":
      return "bg-red-50 border-red-200 text-red-700 font-extrabold";
    case "pending":
    case "pre-booked":
    case "warning":
      return "bg-amber-50 border-amber-200 text-amber-700 font-extrabold";
    case "under maintenance":
    case "secondary":
    default:
      return "bg-slate-100 border-slate-300 text-slate-700 font-extrabold";
  }
}
