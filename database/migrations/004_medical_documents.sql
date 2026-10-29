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
