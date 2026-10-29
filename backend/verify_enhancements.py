import json
import os
import sys
import time
import requests

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

base = os.getenv("BACKEND_URL", "http://127.0.0.1:8001")

print('==========================================================================================')
print('PQC HEALTHSECURE â€” AUTOMATED VERIFICATION SUITE')
print('==========================================================================================')

# TEST 1: Multilingual files
locales_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend', 'src', 'i18n', 'locales')
languages = ['en', 'kn', 'hi']
lang_ok = True
for lng in languages:
    p = os.path.join(locales_dir, f'{lng}.json')
    if not os.path.exists(p):
        lang_ok = False
        print(f'Missing {lng}.json')
    else:
        with open(p, 'r', encoding='utf-8') as f:
            d = json.load(f)
            assert 'nav' in d and 'visualizer' in d and 'security' in d, f'Incomplete keys in {lng}.json'
print(f'1. Feature 1 (Multilingual): English, Kannada (à²•à²¨à³à²¨à²¡), Hindi (à¤¹à¤¿à¤¨à¥à¤¦à¥€) verified: {lang_ok}')

# TEST 2: Transmission Monitor
r_tx = requests.get(f'{base}/api/security/transmissions')
tx_data = r_tx.json()
print(f'2. Feature 2 (Transmission Visualizer): Status {r_tx.status_code} | Total Transmissions: {tx_data.get("count")}')
sample_tx = tx_data['transmissions'][0]
print(f'   Flow Verified: {sample_tx["sender_role"]} -> {sample_tx["receiver_role"]} | Status: {sample_tx["delivery_status"]}')
print(f'   PQC Encryption: {sample_tx["encryption_status"][:45]}...')

# TEST 3: Defensive Threat Detection - Simulate Scenarios
scenarios = ['tamper_signature', 'unauthorized_record_access', 'rate_limit_burst', 'failed_login_brute_force']
sim_ok = True
for sc in scenarios:
    r_sim = requests.post(f'{base}/api/security/simulate', json={'scenario': sc, 'client_ip': '192.168.1.105'})
    if r_sim.status_code != 200:
        sim_ok = False
        print(f'   Simulation failed for {sc}: {r_sim.text}')
print(f'3. Feature 3 (Threat Simulation): All 4 scenarios executed safely: {sim_ok}')

# TEST 4: Tamper-Evident Hash Chain Verification
r_audit = requests.get(f'{base}/api/security/audit/verify')
audit_res = r_audit.json()
print(f'4. Feature 3 (Audit Ledger): Cryptographic SHA-256 Hash Chain Valid: {audit_res.get("valid")} | Records: {audit_res.get("total_records")}')

# TEST 5: Alert Details & Workflow
r_alerts = requests.get(f'{base}/api/security/alerts')
alerts_data = r_alerts.json()
print(f'5. Feature 4 & 5 (Admin Alerts): Active Alerts Count: {alerts_data.get("count")}')
test_alert = alerts_data['alerts'][0]
print(f'   Alert ID: {test_alert["id"]} | Rule: {test_alert["rule_name"]} | Severity: {test_alert["severity"]}')
print(f'   Observed Source: {test_alert["observed_source_ip"]} | Action: {test_alert["defensive_action"][:45]}...')

# Transition alert workflow to RESOLVED
r_patch = requests.patch(f'{base}/api/security/alerts/{test_alert["id"]}', json={
    'status': 'RESOLVED',
    'notes': 'Verified sandbox simulation trace. Cryptographic defense confirmed.'
})
print(f'   Workflow Transition: {r_patch.json().get("alert", {}).get("status")}')

# TEST 6: Rate Limiting Middleware
burst_blocked = False
for i in range(25):
    r_burst = requests.get(f'{base}/api/pqc/kem/keygen')
    if r_burst.status_code == 429:
        burst_blocked = True
        break
print(f'6. Feature 3 (Rate Limiting Middleware): Throttling HTTP 429 Triggered on Burst: {burst_blocked}')

# TEST 7: Post-Quantum Cryptography & QpiAI Quantum SDK
# Wait a moment for burst cooldown if needed
time.sleep(2)
r_kem = requests.post(f'{base}/api/pqc/kem/keygen').json()
r_enc = requests.post(f'{base}/api/pqc/kem/encapsulate', json={'public_key': r_kem['public_key']}).json()
r_dec = requests.post(f'{base}/api/pqc/kem/decapsulate', json={'ciphertext': r_enc['ciphertext'], 'private_key': r_kem['private_key']}).json()
kem_match = (r_enc['shared_secret'] == r_dec['shared_secret'])

r_dsa = requests.post(f'{base}/api/pqc/dsa/keygen').json()
msg = 'PQC-REPORT-AUDIT-SAMPLE'
r_sig = requests.post(f'{base}/api/pqc/dsa/sign', json={'data': msg, 'private_key': r_dsa['private_key']}).json()
r_v_ok = requests.post(f'{base}/api/pqc/dsa/verify', json={'data': msg, 'signature': r_sig['signature'], 'public_key': r_dsa['public_key']}).json()
r_v_bad = requests.post(f'{base}/api/pqc/dsa/verify', json={'data': msg + 'TAMPER', 'signature': r_sig['signature'], 'public_key': r_dsa['public_key']}).json()
dsa_ok = r_v_ok['valid'] and not r_v_bad['valid']

r_quantum = requests.get(f'{base}/api/pqc/quantum/demo?qubits=4').json()
print(f'7. Feature 6 (Cryptographic Engine):')
print(f'   - NIST FIPS 203 ML-KEM-768 Shared Secret Match: {kem_match}')
print(f'   - NIST FIPS 204 ML-DSA-65 Validated & Tamper Rejected: {dsa_ok}')
print(f'   - QpiAI Quantum SDK v0.7.5: Status: {r_quantum.get("status")} | Qubits: {r_quantum.get("qubits")} | Entropy: {r_quantum.get("quantum_entropy_bits")} bits | Depth: {r_quantum.get("circuit_depth")}')
print('==========================================================================================')

