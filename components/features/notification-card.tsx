import * as React from "react";

export interface NotificationItem {
  id: string;
  category: "Rooms" | "Restaurant" | "Service";
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationCardProps {
  /** The full database notification data structure */
  notification: NotificationItem;
  /** True if this card is currently selected by the agent */
  isSelected: boolean;
  /** Trigger callback executing transaction data pre-population */
  onClick: () => void;
}

/**
 * Marakale Dynamic Interaction Notification Card
 * Shifts background tint on active selection and formats operational module tags.
 */
export function NotificationCard({ notification, isSelected, onClick }: NotificationCardProps) {
  // Format standard timestamps to readable text strings
  const formattedTime = new Date(notification.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Category visual tag mappings
  const badgeColors = {
    Rooms: "bg-blue-100 text-blue-800 border-blue-200",
    Restaurant: "bg-orange-100 text-orange-800 border-orange-200",
    Service: "bg-purple-100 text-purple-800 border-purple-200",
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 
        mb-2 
        border 
        rounded-lg 
        cursor-pointer 
        transition-all 
        duration-200 
        shadow-sm
        hover:shadow-md
        ${isSelected 
          ? "bg-slate-100 border-slate-400 font-medium" 
          : notification.is_read 
            ? "bg-white border-slate-100 text-slate-500" 
            : "bg-slate-50 border-slate-200 border-l-4 border-l-slate-900"
        }
      `}
      role="button"
      aria-selected={isSelected}
    >
      <div className="flex items-start justify-between mb-1 gap-4">
        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${badgeColors[notification.category]}`}>
          {notification.category}
        </span>
        <span className="text-xs text-slate-400 font-normal whitespace-nowrap">
          {formattedTime}
        </span>
      </div>
      
      <h4 className={`text-sm ${notification.is_read ? "text-slate-700" : "text-slate-900 font-bold"}`}>
        {notification.title}
      </h4>
      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
        {notification.description}
      </p>
    </div>
  );
}
