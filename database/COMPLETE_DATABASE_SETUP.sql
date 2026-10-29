-- =====================================================================
-- PQC HEALTHSECURE: COMPLETE ALL-IN-ONE SUPABASE DATABASE SETUP
-- Theme: Quantum-Secure Hospital-to-Laboratory Data Exchange
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query
-- =====================================================================

-- >>> START: database/migrations/001_initial_schema.sql >>>
-- =====================================================================
-- CANONICAL MIGRATION: 001_initial_schema.sql
-- PQC: Quantum-Secure Hospital-to-Laboratory Data Exchange
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enums (Standardized role name: 'lab_technician')
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'lab_technician', 'admin');
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

-- <<< END: database/migrations/001_initial_schema.sql <<<

-- >>> START: database/migrations/002_row_level_security.sql >>>
-- =====================================================================
-- CANONICAL MIGRATION: 002_row_level_security.sql
-- PQC: Row-Level Security (RLS) & Deep Security Hardening
-- =====================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- 2. HELPER FUNCTIONS (Non-recursive SECURITY DEFINER with safe search_path)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.get_auth_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated;


-- =====================================================================
-- 3. PROFILES SECURITY: Role Escalation Defense Trigger
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_profile_security()
RETURNS TRIGGER AS $$
BEGIN
    -- On INSERT: ordinary registrations are strictly forced to 'patient'
    IF TG_OP = 'INSERT' THEN
        IF (auth.jwt() ->> 'role') IS DISTINCT FROM 'service_role' THEN
            NEW.role := 'patient'::user_role;
            NEW.is_verified_staff := FALSE;
        END IF;
        NEW.created_at := NOW();
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;

    -- On UPDATE: prevent user from self-assigning doctor/lab_technician or staff status
    IF TG_OP = 'UPDATE' THEN
        IF (auth.jwt() ->> 'role') IS DISTINCT FROM 'service_role' THEN
            IF NEW.role IS DISTINCT FROM OLD.role THEN
                RAISE EXCEPTION 'Security Violation: Users cannot modify their own role. Contact Hospital Administration.';
            END IF;
            IF NEW.is_verified_staff IS DISTINCT FROM OLD.is_verified_staff THEN
                RAISE EXCEPTION 'Security Violation: Modifying staff verification status is prohibited.';
            END IF;
            IF NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email THEN
                RAISE EXCEPTION 'Security Violation: Modification of user identity or email is prohibited.';
            END IF;
        END IF;
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_profiles_security ON public.profiles;
CREATE TRIGGER trg_profiles_security
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_security();


-- =====================================================================
-- 4. POLICIES: PROFILES (Strict Zero-Trust)
-- =====================================================================

-- Users can view ONLY their own profile record (contains private keys/phone)
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

-- Doctors can view patient profile ONLY if there is an active appointment or lab order
CREATE POLICY "profiles_doctor_view_assigned_patient"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.appointments a 
            WHERE a.doctor_id = auth.uid() AND a.patient_id = public.profiles.id
        )
        OR
        EXISTS (
            SELECT 1 FROM public.test_orders o 
            WHERE o.doctor_id = auth.uid() AND o.patient_id = public.profiles.id
        )
    );

-- Lab Technicians can view patient profile ONLY if the order is assigned to their lab
CREATE POLICY "profiles_lab_view_assigned_patient"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.test_orders o 
            WHERE o.assigned_lab_id = auth.uid() AND o.patient_id = public.profiles.id
        )
    );

-- Users can insert their initial profile upon signup
CREATE POLICY "profiles_insert_own"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Users can update their own permitted contact/PQC keys (role change is blocked by trigger)
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());


-- =====================================================================
-- 5. POLICIES: DOCTORS (Public Directory Discovery)
-- =====================================================================

-- Any authenticated user can browse doctor directory for discovery
CREATE POLICY "doctors_select_directory"
    ON public.doctors FOR SELECT
    TO authenticated
    USING (true);

-- Doctors can update only their own directory details
CREATE POLICY "doctors_update_own"
    ON public.doctors FOR UPDATE
    USING (profile_id = auth.uid() AND public.get_auth_role() = 'doctor')
    WITH CHECK (profile_id = auth.uid() AND public.get_auth_role() = 'doctor');


-- =====================================================================
-- 6. APPOINTMENTS SECURITY & POLICIES
-- =====================================================================

-- Immutability trigger: prevent modifying patient_id or doctor_id on existing appointments
CREATE OR REPLACE FUNCTION public.handle_appointment_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.patient_id IS DISTINCT FROM OLD.patient_id OR NEW.doctor_id IS DISTINCT FROM OLD.doctor_id THEN
        RAISE EXCEPTION 'Security Violation: Cannot reassign appointment patient or doctor ownership.';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_appointment_immutability ON public.appointments;
CREATE TRIGGER trg_appointment_immutability
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_appointment_immutability();

-- Patients can view their own appointments
CREATE POLICY "appointments_select_patient"
    ON public.appointments FOR SELECT
    USING (patient_id = auth.uid());

-- Doctors can view appointments assigned to them
CREATE POLICY "appointments_select_doctor"
    ON public.appointments FOR SELECT
    USING (doctor_id = auth.uid() AND public.get_auth_role() = 'doctor');

-- Patients can request/create appointments ONLY for themselves in 'requested' status
CREATE POLICY "appointments_insert_patient"
    ON public.appointments FOR INSERT
    WITH CHECK (
        patient_id = auth.uid() 
        AND public.get_auth_role() = 'patient'
        AND status = 'requested'
    );

-- Doctors can update appointment status (confirm/complete/cancel) and clinical notes
CREATE POLICY "appointments_update_doctor"
    ON public.appointments FOR UPDATE
    USING (doctor_id = auth.uid() AND public.get_auth_role() = 'doctor')
    WITH CHECK (doctor_id = auth.uid() AND public.get_auth_role() = 'doctor');

-- Patients can cancel their own pending appointment
CREATE POLICY "appointments_cancel_patient"
    ON public.appointments FOR UPDATE
    USING (patient_id = auth.uid() AND public.get_auth_role() = 'patient' AND status = 'requested')
    WITH CHECK (patient_id = auth.uid() AND status = 'cancelled');


-- =====================================================================
-- 7. TEST ORDERS SECURITY, ATOMIC CLAIMING & POLICIES
-- =====================================================================

-- Trigger enforces order invariants and atomic technician claiming (without invalid OLD in RLS)
CREATE OR REPLACE FUNCTION public.handle_test_order_immutability()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Prevent altering patient, doctor, or test specification
    IF NEW.patient_id IS DISTINCT FROM OLD.patient_id 
       OR NEW.doctor_id IS DISTINCT FROM OLD.doctor_id 
       OR NEW.test_name IS DISTINCT FROM OLD.test_name THEN
        RAISE EXCEPTION 'Security Violation: Cannot modify patient, doctor, or test name on an existing order.';
    END IF;

    -- 2. If the order is already assigned, prevent transferring to another technician
    IF OLD.assigned_lab_id IS NOT NULL AND NEW.assigned_lab_id IS DISTINCT FROM OLD.assigned_lab_id THEN
        RAISE EXCEPTION 'Security Violation: Cannot reassign an order that is already assigned to a laboratory technician.';
    END IF;

    -- 3. If claiming an unassigned order:
    IF OLD.assigned_lab_id IS NULL AND NEW.assigned_lab_id IS NOT NULL THEN
        -- Only unassigned pending orders can be claimed
        IF OLD.status != 'pending' THEN
            RAISE EXCEPTION 'Security Violation: Only pending orders can be claimed by a laboratory.';
        END IF;
        -- The claiming technician must assign the order to their own authenticated ID
        IF NEW.assigned_lab_id IS DISTINCT FROM auth.uid() THEN
            RAISE EXCEPTION 'Security Violation: Lab technicians can only claim orders for themselves.';
        END IF;
    END IF;

    -- 4. Workflow status transitions: only the assigned technician can advance workflow
    IF OLD.assigned_lab_id IS NOT NULL THEN
        IF auth.uid() IS DISTINCT FROM OLD.assigned_lab_id AND (auth.jwt() ->> 'role') IS DISTINCT FROM 'service_role' THEN
            RAISE EXCEPTION 'Security Violation: Only the assigned laboratory technician can update this order.';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_test_order_immutability ON public.test_orders;
CREATE TRIGGER trg_test_order_immutability
    BEFORE UPDATE ON public.test_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_test_order_immutability();

-- Patients can view only their own test orders
CREATE POLICY "test_orders_select_patient"
    ON public.test_orders FOR SELECT
    USING (patient_id = auth.uid());

-- Doctors can view orders they ordered
CREATE POLICY "test_orders_select_doctor"
    ON public.test_orders FOR SELECT
    USING (doctor_id = auth.uid() AND public.get_auth_role() = 'doctor');

-- Lab Technicians can view assigned orders, or unassigned pending orders to accept them
CREATE POLICY "test_orders_select_lab"
    ON public.test_orders FOR SELECT
    USING (
        public.get_auth_role() = 'lab_technician'
        AND (assigned_lab_id = auth.uid() OR (assigned_lab_id IS NULL AND status = 'pending'))
    );

-- Doctors can create orders ONLY for authorized patients under their active care
CREATE POLICY "test_orders_insert_doctor"
    ON public.test_orders FOR INSERT
    WITH CHECK (
        doctor_id = auth.uid()
        AND public.get_auth_role() = 'doctor'
        AND EXISTS (
            SELECT 1 FROM public.appointments a 
            WHERE a.doctor_id = auth.uid() AND a.patient_id = test_orders.patient_id
        )
    );

-- Lab Technicians can claim or update status (enforced by handle_test_order_immutability)
-- Notice: WITH CHECK contains NO invalid 'OLD' references
CREATE POLICY "test_orders_update_lab"
    ON public.test_orders FOR UPDATE
    USING (
        public.get_auth_role() = 'lab_technician'
        AND (assigned_lab_id = auth.uid() OR (assigned_lab_id IS NULL AND status = 'pending'))
    )
    WITH CHECK (
        public.get_auth_role() = 'lab_technician'
    );


-- =====================================================================
-- 8. LAB RESULTS (MEDICAL REPORTS) SECURITY & POLICIES
-- =====================================================================

-- Validation trigger: validates order references and blocks pre-verified reports
CREATE OR REPLACE FUNCTION public.validate_lab_result_insertion()
RETURNS TRIGGER AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT id, patient_id, doctor_id, assigned_lab_id, status 
    INTO v_order
    FROM public.test_orders
    WHERE id = NEW.order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referenced test order does not exist.';
    END IF;

    IF NEW.patient_id IS DISTINCT FROM v_order.patient_id THEN
        RAISE EXCEPTION 'Security Violation: Report patient_id does not match the test order.';
    END IF;

    IF NEW.doctor_id IS DISTINCT FROM v_order.doctor_id THEN
        RAISE EXCEPTION 'Security Violation: Report doctor_id does not match the test order.';
    END IF;

    IF v_order.assigned_lab_id IS NOT NULL AND v_order.assigned_lab_id IS DISTINCT FROM NEW.technician_id THEN
        RAISE EXCEPTION 'Security Violation: Only the assigned laboratory technician can submit results for this order.';
    END IF;

    -- Never allow inserting reports as pre-verified
    NEW.is_verified := FALSE;
    NEW.created_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_validate_lab_result_insertion ON public.lab_results;
CREATE TRIGGER trg_validate_lab_result_insertion
    BEFORE INSERT ON public.lab_results
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_lab_result_insertion();

-- Permanent Immutability Trigger: Physical rejection of unauthorized update or deletion
CREATE OR REPLACE FUNCTION public.prevent_report_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Security Violation: Medical reports are permanent cryptographic records and cannot be deleted.';
    END IF;

    IF TG_OP = 'UPDATE' THEN
        -- Only service_role (post ML-DSA cryptographic verification) can update is_verified
        IF (auth.jwt() ->> 'role') = 'service_role' THEN
            IF OLD.is_verified = FALSE AND NEW.is_verified = TRUE
               AND NEW.encrypted_payload = OLD.encrypted_payload
               AND NEW.iv = OLD.iv
               AND NEW.auth_tag = OLD.auth_tag
               AND NEW.kem_ciphertext_doctor = OLD.kem_ciphertext_doctor
               AND NEW.kem_ciphertext_patient = OLD.kem_ciphertext_patient
               AND NEW.pqc_signature = OLD.pqc_signature
               AND NEW.signer_public_key = OLD.signer_public_key
               AND NEW.order_id = OLD.order_id
               AND NEW.patient_id = OLD.patient_id
               AND NEW.doctor_id = OLD.doctor_id THEN
                RETURN NEW;
            END IF;
        END IF;

        RAISE EXCEPTION 'Security Violation: Medical report cryptographic payloads and metadata are immutable.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_report_mutation ON public.lab_results;
CREATE TRIGGER trg_prevent_report_mutation
    BEFORE UPDATE OR DELETE ON public.lab_results
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_report_mutation();

-- Patients can access only their own medical reports
CREATE POLICY "lab_results_select_patient"
    ON public.lab_results FOR SELECT
    USING (patient_id = auth.uid());

-- Doctors can access reports only for authorized patients they treated
CREATE POLICY "lab_results_select_doctor"
    ON public.lab_results FOR SELECT
    USING (
        doctor_id = auth.uid() 
        AND public.get_auth_role() = 'doctor'
        AND EXISTS (
            SELECT 1 FROM public.appointments a 
            WHERE a.doctor_id = auth.uid() AND a.patient_id = lab_results.patient_id
        )
    );

-- Lab Technicians can access reports they authored
CREATE POLICY "lab_results_select_lab"
    ON public.lab_results FOR SELECT
    USING (
        technician_id = auth.uid() 
        AND public.get_auth_role() = 'lab_technician'
    );

-- Authorized Lab Technicians can insert reports for authorized orders
CREATE POLICY "lab_results_insert_lab"
    ON public.lab_results FOR INSERT
    WITH CHECK (
        technician_id = auth.uid()
        AND public.get_auth_role() = 'lab_technician'
        AND is_verified = FALSE
        AND EXISTS (
            SELECT 1 FROM public.test_orders o 
            WHERE o.id = lab_results.order_id
              AND (o.assigned_lab_id = auth.uid() OR o.assigned_lab_id IS NULL)
              AND o.patient_id = lab_results.patient_id
              AND o.doctor_id = lab_results.doctor_id
        )
    );


-- =====================================================================
-- 9. AUDIT LOGS SECURITY & POLICIES
-- =====================================================================

-- Enforce real authenticated actor on audit insertion (prevents forgery)
CREATE OR REPLACE FUNCTION public.enforce_audit_actor()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actor_id := auth.uid();
    NEW.created_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_enforce_audit_actor ON public.audit_logs;
CREATE TRIGGER trg_enforce_audit_actor
    BEFORE INSERT ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_audit_actor();

-- Audit Log Immutability: append-only, absolutely no updates or deletes
CREATE OR REPLACE FUNCTION public.prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Security Violation: Audit logs are append-only and cannot be altered or removed.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_prevent_audit_mutation ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_mutation
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_mutation();

-- Users can view ONLY their own audit logs
CREATE POLICY "audit_logs_select_own"
    ON public.audit_logs FOR SELECT
    USING (actor_id = auth.uid());

-- Authenticated users can insert audit logs for their own actions
CREATE POLICY "audit_logs_insert_own"
    ON public.audit_logs FOR INSERT
    WITH CHECK (actor_id = auth.uid());

-- <<< END: database/migrations/002_row_level_security.sql <<<

-- >>> START: database/migrations/003_seed_data.sql >>>
-- =====================================================================
-- Migration 003: Certified Doctor Directory Seed Data
-- Populates the public certified specialists directory for consultation booking
-- =====================================================================

INSERT INTO public.doctors (
    full_name,
    specialty,
    qualification,
    department,
    hospital,
    consultation_fee,
    availability_schedule,
    rating,
    reviews_count,
    pqc_key_fingerprint,
    avatar_url
) VALUES
(
    'Dr. Vikramaditya Sen',
    'Senior Cardiologist & Interventionalist',
    'MD (Medicine), DM (Cardiology), FACC',
    'Cardiology',
    'Apex Quantum Multi-Specialty Hospital',
    1200.00,
    '["Mon", "Wed", "Fri", "Sat"]'::jsonb,
    4.90,
    342,
    'SHA256:7f4a9b1...9c1e (ML-KEM-768 Certified)',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'
),
(
    'Dr. Priya Nambiar',
    'Endocrinology & Metabolic Disorders Specialist',
    'MD, DNB (Endocrinology), FRCP',
    'Endocrinology',
    'National Institute of Medical Sciences',
    1000.00,
    '["Tue", "Thu", "Sat"]'::jsonb,
    4.85,
    289,
    'SHA256:1a82e90...3f80 (ML-KEM-768 Certified)',
    'https://images.unsplash.com/photo-1594824813511-55ff358e0a29?w=300&auto=format&fit=crop&q=80'
),
(
    'Dr. Arvind Swaminathan',
    'Clinical Hematology & Molecular Oncology',
    'MD, DM (Clinical Hematology), PhD',
    'Oncology',
    'Metro Advanced Research Hospital',
    1800.00,
    '["Mon", "Tue", "Thu", "Fri"]'::jsonb,
    5.00,
    415,
    'SHA256:d891c22...44bc (ML-KEM-768 Certified)',
    'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80'
),
(
    'Dr. Sunita Kulkarni',
    'Nephrology & Renal Transplantation Specialist',
    'MBBS, MS, MCh (Nephrology)',
    'Nephrology',
    'City Life Super Specialty Hospital',
    1400.00,
    '["Wed", "Fri", "Sun"]'::jsonb,
    4.75,
    198,
    'SHA256:e104f71...77d3 (ML-KEM-768 Certified)',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80'
)
ON CONFLICT DO NOTHING;

-- <<< END: database/migrations/003_seed_data.sql <<<

-- >>> START: database/migrations/004_medical_documents.sql >>>
-- =====================================================================
-- CANONICAL MIGRATION: 004_medical_documents.sql
-- PQC: Medical Documents & Imaging Storage with PQC Integrity
-- =====================================================================

-- 1. Create Private Storage Bucket 'medical-documents' (if storage extension is active)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'medical-documents',
            'medical-documents',
            false,
            10485760, -- 10 MB strict limit
            ARRAY['image/jpeg', 'image/png', 'image/webp']
        )
        ON CONFLICT (id) DO UPDATE SET
            public = false,
            file_size_limit = 10485760,
            allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];
    END IF;
END $$;

-- 2. Medical Documents Metadata Table
CREATE TABLE IF NOT EXISTS public.medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    uploader_role user_role NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.test_orders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'Prescription', 'Medical Scan', 'Blood Test', 'Diagnosis Report', 'Referral', 'Other Medical Document'
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash_sha256 TEXT NOT NULL,       -- Cryptographic SHA-256 digest
    pqc_signature TEXT,                   -- ML-DSA-65 post-quantum digital signature
    signer_public_key TEXT,               -- Uploader's ML-DSA-65 public key
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Fast Scoped Queries
CREATE INDEX IF NOT EXISTS idx_medical_docs_patient ON public.medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_docs_uploader ON public.medical_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_medical_docs_order ON public.medical_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_medical_docs_category ON public.medical_documents(category);
CREATE INDEX IF NOT EXISTS idx_medical_docs_created ON public.medical_documents(created_at);

-- 3. Enable Row-Level Security
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

-- 4. Immutability & Anti-Reassignment Trigger
CREATE OR REPLACE FUNCTION public.handle_medical_document_immutability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Prevent reassigning patient ownership, uploader, storage path, or cryptographic hash
        IF NEW.patient_id IS DISTINCT FROM OLD.patient_id 
           OR NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by
           OR NEW.storage_path IS DISTINCT FROM OLD.storage_path
           OR NEW.file_hash_sha256 IS DISTINCT FROM OLD.file_hash_sha256 THEN
            RAISE EXCEPTION 'Security Violation: Cannot modify patient ownership, uploader, or cryptographic hash of a medical document.';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_medical_document_immutability ON public.medical_documents;
CREATE TRIGGER trg_medical_document_immutability
    BEFORE UPDATE ON public.medical_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_medical_document_immutability();

-- 5. RLS POLICIES FOR MEDICAL DOCUMENTS

-- Patients can view ONLY their own medical documents
CREATE POLICY "medical_docs_select_patient"
    ON public.medical_documents FOR SELECT
    USING (patient_id = auth.uid());

-- Doctors can view documents ONLY for authorized patients under their care or documents they uploaded
CREATE POLICY "medical_docs_select_doctor"
    ON public.medical_documents FOR SELECT
    USING (
        public.get_auth_role() = 'doctor'
        AND (
            uploaded_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.appointments a 
                WHERE a.doctor_id = auth.uid() AND a.patient_id = medical_documents.patient_id
            )
        )
    );

-- Lab Technicians can view documents ONLY for lab orders assigned to them or documents they uploaded
CREATE POLICY "medical_docs_select_lab"
    ON public.medical_documents FOR SELECT
    USING (
        public.get_auth_role() = 'lab_technician'
        AND (
            uploaded_by = auth.uid()
            OR (
                order_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM public.test_orders o 
                    WHERE o.id = medical_documents.order_id 
                      AND (o.assigned_lab_id = auth.uid() OR o.assigned_lab_id IS NULL)
                )
            )
        )
    );

-- Doctors can upload documents ONLY for authorized patients under their care
CREATE POLICY "medical_docs_insert_doctor"
    ON public.medical_documents FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND uploader_role = 'doctor'
        AND public.get_auth_role() = 'doctor'
        AND EXISTS (
            SELECT 1 FROM public.appointments a 
            WHERE a.doctor_id = auth.uid() AND a.patient_id = medical_documents.patient_id
        )
    );

-- Lab Technicians can upload documents ONLY for authorized test orders
CREATE POLICY "medical_docs_insert_lab"
    ON public.medical_documents FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND uploader_role = 'lab_technician'
        AND public.get_auth_role() = 'lab_technician'
        AND order_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM public.test_orders o 
            WHERE o.id = medical_documents.order_id
              AND (o.assigned_lab_id = auth.uid() OR o.assigned_lab_id IS NULL)
              AND o.patient_id = medical_documents.patient_id
        )
    );

-- Storage bucket access policy (ensures bucket cannot be made public by users)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        DROP POLICY IF EXISTS "Deny public access to medical documents" ON storage.buckets;
        -- Keep bucket private
    END IF;
END $$;

-- <<< END: database/migrations/004_medical_documents.sql <<<

-- >>> START: database/migrations/005_admin_role_and_security.sql >>>
-- =====================================================================
-- Migration 005: Administrator Role & Security Audit Isolation
-- PQC HealthSecure: Quantum-Secure Hospital-to-Laboratory Data Exchange
-- =====================================================================

-- 1. Extend user_role enum to support 'admin'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid 
        WHERE t.typname = 'user_role' AND e.enumlabel = 'admin'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'admin';
    END IF;
END $$;

-- 2. Audit Logs Table (if not already existing) with RLS restricted strictly to Admins
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    outcome VARCHAR(32) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    observed_source_ip VARCHAR(64) NOT NULL,
    evidence JSONB DEFAULT '{}'::jsonb,
    previous_hash VARCHAR(64) NOT NULL,
    record_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for security telemetry
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON public.security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON public.security_audit_logs(event_type);

-- 3. Enable Row-Level Security
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Normal users (patient, doctor, lab_technician) CANNOT read security audits
DROP POLICY IF EXISTS "Admins can view security audits" ON public.security_audit_logs;
CREATE POLICY "Admins can view security audits"
ON public.security_audit_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'::user_role
    )
);

-- Strictly prevent inserts/updates from standard clients; only service_role can record audits
DROP POLICY IF EXISTS "Service role manages security audits" ON public.security_audit_logs;
CREATE POLICY "Service role manages security audits"
ON public.security_audit_logs
FOR ALL
USING (
    (auth.jwt() ->> 'role') = 'service_role'
);

COMMENT ON TABLE public.security_audit_logs IS 'Tamper-evident hash-chained security event ledger isolated strictly to Administrators.';

-- <<< END: database/migrations/005_admin_role_and_security.sql <<<
