-- ========================================================
-- MARAKALE SERVICED APARTMENTS - SECURITY POLICIES (RLS)
-- Location: supabase/migrations/03_security_policies.sql
-- ========================================================

-- Enable master security controls across tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES SECURITY POLICIES
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Owners can modify profile permissions and active states" 
ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
);

-- 2. ROOMS SECURITY POLICIES
CREATE POLICY "Rooms catalog is viewable by anyone visiting the site" 
ON rooms FOR SELECT USING (TRUE);

CREATE POLICY "Staff and owners can adjust room statuses" 
ON rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'receptionist'))
);

-- 3. RESERVATIONS SECURITY POLICIES
CREATE POLICY "Reception, Admins, and Owners have total reservation visibility" 
ON reservations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'receptionist'))
);

CREATE POLICY "Guests can check their own reservation logs via tracking email matches" 
ON reservations FOR SELECT USING (guest_email = auth.email());

-- 4. SYSTEM REAL-TIME NOTIFICATIONS POLICIES
CREATE POLICY "Staff operators can review and clear system notification counters" 
ON system_notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'receptionist'))
);

-- 5. MEALS & MAINTENANCE LOGS RECONCILIATIONS POLICIES
CREATE POLICY "Staff can supervise active meal and service pipelines" 
ON meal_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin', 'receptionist'))
);

CREATE POLICY "Active house guests can place or audit their own module orders" 
ON meal_orders FOR ALL USING (
  reservation_id IN (
    SELECT id FROM reservations WHERE guest_email = auth.email() AND status = 'Active'
  )
);

CREATE POLICY "Active house guests can submit engineering service tickets" 
ON service_requests FOR ALL USING (
  reservation_id IN (
    SELECT id FROM reservations WHERE guest_email = auth.email() AND status = 'Active'
  )
);
