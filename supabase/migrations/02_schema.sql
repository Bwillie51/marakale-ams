-- ==========================================
-- MARAKALE SERVICED APARTMENTS - CORE SCHEMA
-- Location: supabase/migrations/02_schema.sql
-- ==========================================

-- 1. ENUMS & CUSTOM TYPES
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'receptionist', 'guest');
CREATE TYPE room_status AS ENUM ('Vacant', 'Occupied', 'Pre-Booked', 'Under Maintenance', 'Not Applicable');
CREATE TYPE booking_status AS ENUM ('Pending', 'Active', 'Completed', 'Cancelled');
CREATE TYPE order_status AS ENUM ('Pending', 'Preparing', 'Delivered', 'Cancelled');

-- 2. USERS & PROFILES TABLE
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'guest',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    permissions JSONB DEFAULT '{}'::jsonb, -- Admin configuration toggles for features
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROOMS INVENTORY TABLE
CREATE TABLE rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_number TEXT UNIQUE NOT NULL,
    room_type TEXT NOT NULL, -- 4 distinct tiers configured by owner
    base_rate NUMERIC(10, 2) NOT NULL,
    status room_status NOT NULL DEFAULT 'Vacant',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RESERVATIONS MASTER TABLE
CREATE TABLE reservations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_id_ref TEXT,
    check_in TIMESTAMPTZ NOT NULL,
    check_out TIMESTAMPTZ NOT NULL,
    checkout_hour_limit TIME, -- Set by receptionist at counter confirmation
    status booking_status NOT NULL DEFAULT 'Pending',
    total_days INT NOT NULL,
    base_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    gst_amount NUMERIC(10, 2) NOT NULL,
    net_amount NUMERIC(10, 2) NOT NULL,
    is_pay_later BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RESERVATION ROOM ALLOCATIONS (Handles multi-room bookings under 1 reservation)
CREATE TABLE reservation_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
    room_id UUID REFERENCES rooms(id) ON DELETE RESTRICT NOT NULL,
    UNIQUE(room_id, reservation_id)
);

-- 6. REAL-TIME UNIFIED NOTIFICATIONS STREAM
CREATE TABLE system_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL, -- 'Rooms', 'Restaurant', 'Service'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_id UUID NOT NULL, -- Links to reservation_id, order_id, etc.
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RESTAURANT & MEALS ORDERS TABLE
CREATE TABLE meal_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
    room_number TEXT NOT NULL,
    order_details JSONB NOT NULL, -- Array of items, quantities, and prices
    total_cost NUMERIC(10, 2) NOT NULL,
    status order_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ROOM SERVICE / HOUSEKEEPING REQUESTS TABLE
CREATE TABLE service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE NOT NULL,
    room_number TEXT NOT NULL,
    request_type TEXT NOT NULL, -- 'Housekeeping', 'Maintenance', 'Laundry'
    notes TEXT,
    status order_status NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
