# Supabase Integration Guide for PQC-HEALTH

Follow these exact steps to connect your Supabase database and enforce Row-Level Security:

## Step 1: Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create or open your project.
2. Note your **Project URL** and **API Keys** from `Project Settings -> API`.

## Step 2: Run Database Schema Migrations
1. In the Supabase Dashboard, open the **SQL Editor** tab.
2. Paste the contents of `database/01_schema.sql` and click **Run**.
   * Creates `profiles`, `appointments`, `lab_orders`, `medical_reports`, and `audit_logs`.
3. Paste the contents of `database/02_rls_policies.sql` and click **Run**.
   * Enables Row-Level Security (RLS) on all 5 tables and defines granular role policies.

## Step 3: Configure Environment Variables
Create `.env` in the `frontend/` directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_BACKEND_API_URL=http://127.0.0.1:8000/api
```

Create `.env` in the `backend/` directory:
```env
ENVIRONMENT=development
PORT=8000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-keep-private
QPIAI_API_TOKEN=your-qpiai-token-if-using-cloud
```

## Step 4: Verification
After providing your keys, test user signup in each role:
* Patient signup (`role = 'patient'`)
* Doctor signup (`role = 'doctor'`)
* Lab Technician signup (`role = 'lab_technician'`)
Check that a patient querying `/rest/v1/medical_reports` receives only their own records, while doctors receive only their assigned patients' reports.
