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
