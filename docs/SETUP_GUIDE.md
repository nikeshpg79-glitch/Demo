# PQC-HEALTH: Setup and Local Development Guide

This guide provides exact step-by-step instructions for running the Quantum-Secure Hospital-to-Laboratory Data Exchange system locally on Windows PowerShell.

---

## 1. Prerequisites
* **Node.js**: v20+ (Verified with `v24.19.0`)
* **Python**: 3.10+ (Verified with `3.14.7`)
* **Git**: Installed
* **QpiAI Quantum SDK**: Installed (`qpiai-quantum 0.7.5`)

---

## 2. Frontend Setup (React + Vite + TypeScript)

Open Windows PowerShell in the project directory:

```powershell
cd "c:\Users\Bhagya HG\OneDrive\Desktop\pqc-healthcare\frontend"
npm install
npm run dev
```

* **Local URL**: `http://localhost:5173`
* **Build Check**: `npm run build`

---

## 3. Backend Setup (FastAPI + PQC Service)

Open a second Windows PowerShell terminal:

```powershell
cd "c:\Users\Bhagya HG\OneDrive\Desktop\pqc-healthcare\backend"
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

* **API Health Check**: `http://127.0.0.1:8000/api/health`
* **Swagger API Documentation**: `http://127.0.0.1:8000/docs`
* **ReDoc Documentation**: `http://127.0.0.1:8000/redoc`

---

## 4. Database Setup (Supabase PostgreSQL + RLS)

1. Log in to your project at [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Copy and execute `database/01_schema.sql`.
4. Copy and execute `database/02_rls_policies.sql`.
5. Copy your **Project URL** and **Anon Key** into `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
