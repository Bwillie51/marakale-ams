import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Initialize a scoped client instance fallback 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface NotificationCounts {
  rooms: number;
  restaurant: number;
  service: number;
}

/**
 * Marakale Real-Time Notification State Manager Hook
 * Streams Postgres change vectors into synchronized reactive increments.
 */
export function useNotificationManager() {
  const [counts, setCounts] = useState<NotificationCounts>({
    rooms: 0,
    restaurant: 0,
    service: 0,
  });

  useEffect(() => {
    // 1. Fetch initial balance states for unread records upon hook initialization
    const fetchInitialCounts = async () => {
      const { data, error } = await supabase
        .from("system_notifications")
        .select("category, is_read")
        .eq("is_read", false);

      if (error || !data) return;

      const newCounts = { rooms: 0, restaurant: 0, service: 0 };
      data.forEach((item) => {
        if (item.category === "Rooms") newCounts.rooms++;
        if (item.category === "Restaurant") newCounts.restaurant++;
        if (item.category === "Service") newCounts.service++;
      });
      setCounts(newCounts);
    };

    fetchInitialCounts();

    // 2. Set up a persistent Supabase Realtime Broadcast Channel channel connection
    const streamChannel = supabase
      .channel("live-alerts-stream")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_notifications" },
        (payload) => {
          // Increment tracking for a brand new alert insert record
          if (payload.eventType === "INSERT" && !payload.new.is_read) {
            setCounts((prev) => ({
              ...prev,
              rooms: payload.new.category === "Rooms" ? prev.rooms + 1 : prev.rooms,
              restaurant: payload.new.category === "Restaurant" ? prev.restaurant + 1 : prev.restaurant,
              service: payload.new.category === "Service" ? prev.service + 1 : prev.service,
            }));
          }

          // Decrement or balance tracking if a row was checked off or deleted
          if (payload.eventType === "UPDATE") {
            const becameRead = payload.new.is_read && !payload.old.is_read;
            if (becameRead) {
              setCounts((prev) => ({
                ...prev,
                rooms: payload.new.category === "Rooms" ? Math.max(0, prev.rooms - 1) : prev.rooms,
                restaurant: payload.new.category === "Restaurant" ? Math.max(0, prev.restaurant - 1) : prev.restaurant,
                service: payload.new.category === "Service" ? Math.max(0, prev.service - 1) : prev.service,
              }));
            }
          }
        }
      )
      .subscribe();

    // Cleanup hook listener routines to prevent memory leakage
    return () => {
      supabase.removeChannel(streamChannel);
    };
  }, []);

  /** Manually clear or decrement a specific category tier if needed from local UI panels */
  const clearLocalItem = (category: "Rooms" | "Restaurant" | "Service") => {
    setCounts((prev) => ({
      ...prev,
      rooms: category === "Rooms" ? Math.max(0, prev.rooms - 1) : prev.rooms,
      restaurant: category === "Restaurant" ? Math.max(0, prev.restaurant - 1) : prev.restaurant,
      service: category === "Service" ? Math.max(0, prev.service - 1) : prev.service,
    }));
  };

  return { counts, clearLocalItem };
}
