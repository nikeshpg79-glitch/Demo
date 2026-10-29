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
