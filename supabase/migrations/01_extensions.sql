-- ========================================================
-- MARAKALE SERVICED APARTMENTS - CORE EXTENSIONS
-- Location: supabase/migrations/01_extensions.sql
-- ========================================================

-- Enable core cryptographic tool sets for generating secure UUID keys natively
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic primitives (e.g., gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable structural JSON helper functions for permission matrix evaluations
CREATE EXTENSION IF NOT EXISTS hstore;
