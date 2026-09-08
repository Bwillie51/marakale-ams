-- ========================================================
-- MARAKALE SERVICED APARTMENTS - AUTO TRIGGERS & PROCEDURES
-- Location: supabase/migrations/04_triggers.sql
-- ========================================================

-- 1. FUNCTION: HANDLE NEW ONLINE RESERVATION NOTIFICATIONS
CREATE OR REPLACE FUNCTION process_reservation_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- If a booking is initially submitted online (Pending / Pre-Booked), inject an alert into the real-time stream
    IF NEW.status = 'Pending' THEN
        INSERT INTO system_notifications (category, title, description, target_id, is_read)
        VALUES (
            'Rooms',
            'New Online Booking Request',
            'Guest ' || NEW.guest_name || ' requested a reservation. Awaiting counter verification.',
            NEW.id,
            FALSE
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Run immediately when an online booking row is inserted
CREATE OR REPLACE TRIGGER trg_on_reservation_created
    AFTER INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION process_reservation_notification();


-- 2. FUNCTION: HANDLE ROOM STATUS SWITCHING UPON CONFIRMATION
CREATE OR REPLACE FUNCTION sync_room_status_on_allocation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update assigned room to 'Pre-Booked' state right away to lock it against overlapping online double-bookings
    UPDATE rooms 
    SET status = 'Pre-Booked' 
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Run when a room is mapped under an unverified reservation
CREATE OR REPLACE TRIGGER trg_on_room_allocated
    AFTER INSERT ON reservation_rooms
    FOR EACH ROW
    EXECUTE FUNCTION sync_room_status_on_allocation();


-- 3. FUNCTION: IN-HOUSE GUEST SERVICE REQUEST ROUTING INSERTS
CREATE OR REPLACE FUNCTION process_guest_service_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Dynamically route meal or service orders directly into the notification engine with appropriate channel tags
    IF TG_TABLE_NAME = 'meal_orders' THEN
        INSERT INTO system_notifications (category, title, description, target_id, is_read)
        VALUES ('Restaurant', 'New Restaurant Order', 'Room ' || NEW.room_number || ' submitted a new food/drink order.', NEW.id, FALSE);
    ELSIF TG_TABLE_NAME = 'service_requests' THEN
        INSERT INTO system_notifications (category, title, description, target_id, is_read)
        VALUES ('Service', 'Housekeeping Request', 'Room ' || NEW.room_number || ' requested immediate room maintenance.', NEW.id, FALSE);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS: Map background actions seamlessly for guest features
CREATE OR REPLACE TRIGGER trg_on_meal_order_created
    AFTER INSERT ON meal_orders
    FOR EACH ROW
    EXECUTE FUNCTION process_guest_service_notification();

CREATE OR REPLACE TRIGGER trg_on_service_request_created
    AFTER INSERT ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION process_guest_service_notification();


-- 4. CLEANUP PROCEDURE: AUTO-RELEASE EXPIRED 24-HOUR ONLINE HOLDS
-- Designed to be safely kicked off via standard scheduled background cron routines
CREATE OR REPLACE PROCEDURE release_expired_pre_bookings()
LANGUAGE plpgsql AS $$
BEGIN
    -- Step A: Revert any room tracking back to 'Vacant' if the check-in deadline was missed
    UPDATE rooms
    SET status = 'Vacant'
    WHERE id IN (
        SELECT rr.room_id 
        FROM reservation_rooms rr
        JOIN reservations r ON rr.reservation_id = r.id
        WHERE r.status = 'Pending' 
        AND r.created_at < NOW() - INTERVAL '24 hours'
    );

    -- Step B: Cancel the corresponding reservation records cleanly
    UPDATE reservations
    SET status = 'Cancelled'
    WHERE status = 'Pending' 
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;
