-- ========================================================
-- MARAKALE SERVICED APARTMENTS - DATABASE SEED INVENTORY
-- Location: supabase/seed.sql
-- ========================================================

-- 1. SEED DEFAULT ROOM TIER MODELS (4 Distinct Tiers)
INSERT INTO rooms (room_number, room_type, base_rate, status) VALUES
('A-101', 'Standard Suite', 120.00, 'Vacant'),
('A-102', 'Standard Suite', 120.00, 'Vacant'),
('B-201', 'Deluxe Studio', 180.00, 'Vacant'),
('B-202', 'Deluxe Studio', 180.00, 'Vacant'),
('C-301', 'Executive Apartment', 250.00, 'Vacant'),
('C-302', 'Executive Apartment', 250.00, 'Vacant'),
('D-401', 'Presidential Penthouse', 450.00, 'Vacant');

-- 2. SEED SAMPLE TEST PROFILES (For Login Testing Checkpoints)
-- Note: In production, these rows hook cleanly into auth.users UUID arrays
INSERT INTO profiles (id, full_name, email, role, is_active, permissions) VALUES
('00000000-0000-0000-0000-000000000001', 'Marakale Principal Owner', 'owner@marakale.com', 'owner', TRUE, '{}'::jsonb),
('00000000-0000-0000-0000-000000000002', 'John Walker Administrator', 'admin@marakale.com', 'admin', TRUE, '{"canGenerateReports": true}'::jsonb),
('00000000-0000-0000-0000-000000000003', 'Sarah Jenkins Desk Operator', 'reception@marakale.com', 'receptionist', TRUE, 
  '{"handleOfflineBookings": true, "handlePayLater": true, "handleMealsAndHousekeeping": true, "generateFinancialReports": false, "hasRoomReservationRights": true}'::jsonb);

-- 3. SEED INITIAL BOOKING & REVENUE SAMPLE RECORDS
INSERT INTO reservations (id, guest_name, guest_email, check_in, check_out, total_days, base_amount, discount_amount, gst_amount, net_amount, status, is_pay_later) VALUES
('e8b09d22-1111-4444-a1a1-999999999999', 'Alex Mercer', 'alex@example.com', NOW(), NOW() + INTERVAL '4 days', 4, 480.00, 24.00, 45.60, 501.60, 'Active', FALSE);

-- Assign Room A-101 to the live guest session record above
INSERT INTO reservation_rooms (reservation_id, room_id) VALUES
('e8b09d22-1111-4444-a1a1-999999999999', (SELECT id FROM rooms WHERE room_number = 'A-101'));
UPDATE rooms SET status = 'Occupied' WHERE room_number = 'A-101';

-- 4. SEED UNREAD NOTIFICATION STREAM QUEUES (Populates your live dashboard counts)
INSERT INTO system_notifications (category, title, description, target_id, is_read, created_at) VALUES
('Rooms', 'New Online Booking Request', 'Guest Sarah Connor requested a 5-day hold. Awaiting counter verification.', 'e8b09d22-1111-4444-a1a1-999999999999', FALSE, NOW() - INTERVAL '10 minutes'),
('Restaurant', 'New Restaurant Order', 'Room A-101 submitted a new food/drink order request.', 'e8b09d22-1111-4444-a1a1-999999999999', FALSE, NOW() - INTERVAL '5 minutes'),
('Service', 'Housekeeping Request', 'Room A-101 requested immediate room maintenance or clean turn-down.', 'e8b09d22-1111-4444-a1a1-999999999999', FALSE, NOW() - INTERVAL '2 minutes');
