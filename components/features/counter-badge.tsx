import * as React from "react";

interface CounterBadgeProps {
  /** The real-time notification numeric balance */
  count: number;
  /** Optional theme variation layout to distinguish categories */
  variant?: "default" | "restaurant" | "service";
}

/**
 * Marakale Real-Time Notification Counter Primitive
 * Handles automatic visual adjustments based on numeric status layers.
 */
export function CounterBadge({ count, variant = "default" }: CounterBadgeProps) {
  // If no items remain or value drops to zero, render absolutely nothing
  if (count <= 0) return null;

  // Custom visual layouts mapped distinctly by system module
  const variantStyles = {
    default: "bg-red-600 text-white animate-pulse",
    restaurant: "bg-orange-500 text-white",
    service: "bg-blue-600 text-white",
  };

  return (
    <span
      className={`
        inline-flex 
        items-center 
        justify-center 
        min-w-[20px] 
        h-5 
        px-1.5 
        text-xs 
        font-bold 
        rounded-full 
        shadow-sm 
        transition-all 
        duration-300 
        scale-100
        ${variantStyles[variant]}
      `}
      aria-label={`${count} unread system notifications`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
