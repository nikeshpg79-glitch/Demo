# PQC-HEALTH: Quantum-Secure Hospital-to-Laboratory Data Exchange
> **NIST Post-Quantum Cryptography Architecture**
> **Theme:** Long-Term Confidentiality in Hospital-to-Laboratory Data Exchange

---

## Architecture Overview

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, `@supabase/supabase-js`
* **Backend**: Python FastAPI microservice (`backend/`)
* **Cryptography**:
  * **ML-KEM-768** (NIST FIPS 203) — Post-Quantum Key Encapsulation Mechanism
  * **AES-256-GCM** (NIST SP 800-38D) — Authenticated Symmetric Encryption
  * **ML-DSA-65** (NIST FIPS 204) — Post-Quantum Digital Signatures
* **Quantum Engine**: QpiAI Quantum SDK v0.7.5 (Superposition & Entanglement circuits, QRNG)
* **Database & Auth**: Supabase PostgreSQL with strict Row-Level Security (RLS)

---

## 1. Supabase Database Migration Guide

Apply the version-controlled SQL migrations in your Supabase project in numerical order:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and navigate to the **SQL Editor** tab.
2. **Migration 001:** Copy and run `database/migrations/001_initial_schema.sql`
   * Creates custom ENUMs (`user_role`, `appointment_status`, `order_status`, `priority_level`).
   * Creates `profiles`, `doctors`, `appointments`, `test_orders`, `lab_results`, and `audit_logs` tables with UUID primary keys and performance indexes.
3. **Migration 002:** Copy and run `database/migrations/002_row_level_security.sql`
   * Enables RLS on all 6 tables.
   * Installs the role tamper-prevention trigger blocking unauthorized privilege escalation to `doctor` or `lab_assistant`.
   * Enforces zero-trust data isolation (Patients only see own records, Doctors only see assigned patients, Lab Technicians only see lab orders).
4. **Migration 003:** Copy and run `database/migrations/003_seed_data.sql`
   * Seeds certified medical specialists into the public doctor directory.

---

## 2. Environment Setup (.env)

Create a local `.env` file in the `frontend/` directory (excluded from Git):

```powershell
# File location: c:\Users\Bhagya HG\OneDrive\Desktop\pqc-healthcare\frontend\.env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
VITE_BACKEND_API_URL=http://127.0.0.1:8000/api
```

> **Note:** If your Supabase dashboard provides a **publishable key** (`sb_pub_...`), assign it to `VITE_SUPABASE_ANON_KEY` as both are fully supported by the client.

---

## 3. Local Development Commands (Windows PowerShell)

### Frontend (React + Vite)
```powershell
cd "c:\Users\Bhagya HG\OneDrive\Desktop\pqc-healthcare\frontend"
npm install
npm run dev
```
* **Local Browser URL:** [http://localhost:5173](http://localhost:5173)
* **Verify Production Build:** `npm run build`

### Backend (FastAPI PQC Microservice)
```powershell
cd "c:\Users\Bhagya HG\OneDrive\Desktop\pqc-healthcare\backend"
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* **API Health Check:** [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
* **Swagger API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 4. Security & Role Management
* **Public Registration**: Ordinary sign-up strictly assigns the `patient` role.
* **Staff Verification**: Registering as `doctor` or `lab_technician` requires an administrative authorization code:
  * Doctor Demo Token: `HOSPITAL-DOC-2026`
  * Lab Assistant Demo Token: `LAB-ASSIST-2026`
* **Zero Secret Exposure**: Secret keys, Supabase service-role keys, and private keys remain strictly on the backend/session layer and are never compiled into the frontend.
# pqc-healthcare
PQC HealthSecure - Secure healthcare data exchange using post-quantum cryptography
