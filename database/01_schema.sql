-- =====================================================================
-- CANONICAL MIGRATION ALIAS: 001_initial_schema.sql
-- (Mirror of database/migrations/001_initial_schema.sql)
-- PQC: Quantum-Secure Hospital-to-Laboratory Data Exchange
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enums (Standardized role name: 'lab_technician')
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'lab_technician');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('requested', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'sample_collected', 'in_analysis', 'completed', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('routine', 'urgent', 'stat_emergency');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles Table (extends Supabase auth.users)
-- Stores private user identity. Never exposed via public queries.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'patient',
    phone_number TEXT,
    department TEXT,
    license_number TEXT,
    pqc_public_key TEXT,            -- ML-KEM-768 Public Key (Base64)
    pqc_dsa_public_key TEXT,        -- ML-DSA-65 Public Key (Base64)
    is_verified_staff BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Doctors Directory Table
-- Exposes ONLY discovery fields needed for patient search.
-- Does NOT expose private profile records or internal credentials.
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    qualification TEXT NOT NULL,
    department TEXT NOT NULL,
    hospital TEXT NOT NULL,
    consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 1200.00,
    availability_schedule JSONB NOT NULL DEFAULT '["Mon", "Wed", "Fri"]'::jsonb,
    rating NUMERIC(3,2) NOT NULL DEFAULT 4.90,
    reviews_count INT NOT NULL DEFAULT 150,
    pqc_key_fingerprint TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'requested',
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Test Orders Table (Hospital to Lab Requisitions)
CREATE TABLE IF NOT EXISTS public.test_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_lab_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    test_name TEXT NOT NULL,
    priority priority_level NOT NULL DEFAULT 'routine',
    instructions TEXT NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Lab Results Table (Post-Quantum Encrypted Medical Reports)
-- is_verified defaults strictly to FALSE. Requires cryptographic signature validation to become TRUE.
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.test_orders(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    technician_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    report_title TEXT NOT NULL,
    specimen_type TEXT NOT NULL,
    
    -- PQC Cryptographic Payload & Envelope
    encrypted_payload TEXT NOT NULL,     -- AES-256-GCM ciphertext (Base64)
    iv TEXT NOT NULL,                    -- 96-bit initialization vector (Base64)
    auth_tag TEXT NOT NULL,              -- 128-bit authentication tag (Base64)
    kem_ciphertext_doctor TEXT NOT NULL, -- ML-KEM-768 encapsulated key for Doctor (Base64)
    kem_ciphertext_patient TEXT NOT NULL,-- ML-KEM-768 encapsulated key for Patient (Base64)
    pqc_signature TEXT NOT NULL,         -- ML-DSA-65 lattice digital signature (Base64)
    signer_public_key TEXT NOT NULL,     -- Lab technician's ML-DSA-65 public key (Base64)
    
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Audit Logs Table (Tamper-Proof Append-Only Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,                -- e.g. 'KEY_ENCAPSULATION', 'SIGNATURE_VERIFIED', 'REPORT_DECRYPTED'
    record_type TEXT NOT NULL,           -- 'test_order', 'lab_result', 'appointment'
    record_id UUID,
    ip_address TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Security Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_doctors_profile_id ON public.doctors(profile_id);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON public.doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_department ON public.doctors(department);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_test_orders_patient ON public.test_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_orders_doctor ON public.test_orders(doctor_id);
CREATE INDEX IF NOT EXISTS idx_test_orders_assigned_lab ON public.test_orders(assigned_lab_id);
CREATE INDEX IF NOT EXISTS idx_test_orders_status ON public.test_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_results_order ON public.lab_results(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_patient ON public.lab_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_doctor ON public.lab_results(doctor_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_technician ON public.lab_results(technician_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
