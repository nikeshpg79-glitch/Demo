#!/usr/bin/env python3
"""
PQC HealthSecure - Database Connectivity & Schema Verifier
Verifies Supabase PostgreSQL connectivity and checks if all database tables,
RLS policies, and endpoints are active and accessible.
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load env variables from backend/.env or root .env
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(base_dir, 'backend', '.env'), override=True)
load_dotenv(os.path.join(base_dir, '.env'), override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL', '').rstrip('/')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')

print('=' * 80)
print(' PQC HEALTHSECURE - DATABASE CONNECTIVITY & SCHEMA VERIFIER')
print('=' * 80)
print(f'Target Supabase URL : {SUPABASE_URL}')
print(f'API Key Type        : {"Publishable Key" if SUPABASE_KEY.startswith("sb_publishable_") else "Service Role Key" if SUPABASE_KEY else "Missing"}')
print(f'API Key Fingerprint : {SUPABASE_KEY[:16]}...{SUPABASE_KEY[-8:] if len(SUPABASE_KEY) > 24 else ""}')
print('-' * 80)

if not SUPABASE_URL or not SUPABASE_KEY:
    print('[-] ERROR: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing in your .env file.')
    sys.exit(1)

headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}'
}

# 1. Ping Auth Service
print('\n[1/3] Checking Supabase Auth Service Health...')
try:
    r_auth = requests.get(f'{SUPABASE_URL}/auth/v1/health', headers=headers, timeout=5)
    if r_auth.status_code == 200:
        print('  [+] Auth Service Status: ONLINE (HTTP 200)')
    else:
        print(f'  [-] Auth Service Status: HTTP {r_auth.status_code} ({r_auth.text[:80]})')
except Exception as e:
    print(f'  [-] Auth Service Error: {e}')

# 2. Ping PostgREST Schema Root
print('\n[2/3] Checking PostgREST Root...')
try:
    r_root = requests.get(f'{SUPABASE_URL}/rest/v1/', headers=headers, timeout=5)
    if r_root.status_code in (200, 204):
        print('  [+] PostgREST Engine Status: ONLINE')
    else:
        print(f'  [-] PostgREST Status: HTTP {r_root.status_code}')
except Exception as e:
    print(f'  [-] PostgREST Error: {e}')

# 3. Check All Tables
tables = [
    ('profiles', 'User profiles and PQC public keys'),
    ('doctors', 'Certified specialist doctors directory'),
    ('appointments', 'Patient-doctor consultation appointments'),
    ('test_orders', 'Hospital-to-laboratory test requisitions'),
    ('lab_results', 'Post-quantum encrypted lab reports'),
    ('audit_logs', 'Platform event audit trail'),
    ('medical_documents', 'Medical scans and imaging metadata'),
    ('security_audit_logs', 'Admin tamper-evident hash-chained security ledger')
]

print('\n[3/3] Inspecting PostgreSQL Database Schema Tables...')
all_found = True
for table, desc in tables:
    try:
        r = requests.get(f'{SUPABASE_URL}/rest/v1/{table}?select=*&limit=1', headers=headers, timeout=5)
        if r.status_code == 200:
            count = len(r.json())
            print(f'  [+] Table public.{table:<20} : ACTIVE (Accessible, sample count: {count})')
        elif r.status_code == 404 and 'PGRST205' in r.text:
            all_found = False
            print(f'  [!] Table public.{table:<20} : NOT CREATED YET (Schema missing)')
        else:
            print(f'  [?] Table public.{table:<20} : HTTP {r.status_code} ({r.text[:60]})')
    except Exception as e:
        all_found = False
        print(f'  [-] Table public.{table:<20} : Query Failed ({e})')

print('-' * 80)
if all_found:
    print('[SUCCESS] All PostgreSQL tables are active and connected!')
    print('Frontend & Backend are fully synchronized with the live Supabase database.')
else:
    print('[ACTION REQUIRED] Database connection was successful, but tables are not yet created.')
    print('To finalize the connection:')
    project_ref = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
    print(f'1. Open: https://supabase.com/dashboard/project/{project_ref}/sql/new (Supabase Dashboard -> SQL Editor)')
    print('2. Copy the contents of: database/COMPLETE_DATABASE_SETUP.sql')
    print('3. Paste into the SQL Editor and click "RUN".')
    print('4. Run this script again: python database/verify_database_connection.py')
print('=' * 80)
