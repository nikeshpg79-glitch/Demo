import requests
import json

API_URL = "http://127.0.0.1:8001/api/pqc"

def test_1_decrypt_rep_9901():
    print("\n--- TEST 1: Decrypt Pre-seeded Record rep-9901 (Patient pat-001) ---")
    payload = {
        "record_id": "rep-9901",
        "recipient_id": "pat-001",
        "recipient_role": "patient",
        "simulate_tamper": False
    }
    resp = requests.post(f"{API_URL}/record/decrypt-pipeline", json=payload)
    print(f"Status Code: {resp.status_code}")
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    print("Steps summary:")
    for step in data.get("steps_telemetry", []):
        print(f"  Step {step.get('step_number')}: {step.get('step_name')} -> {step.get('status')}")
        if step.get("error"):
            print(f"    ERROR: {step.get('error')}")
    
    assert data["success"] is True, f"Expected success=True, got {data}"
    assert data["verified"] is True, f"Expected verified=True, got {data}"
    assert data["decrypted_record"] is not None, "Decrypted record should not be None"
    print("Decrypted payload preview:", str(data["decrypted_record"])[:140])
    print("[PASS] Test 1: rep-9901 successfully decrypted with valid GHASH and ML-DSA-65!")

def test_2_encrypt_and_decrypt_new_record():
    print("\n--- TEST 2: Doctor doc-101 Encrypts New Record for Patient pat-001, then Decrypts ---")
    enc_payload = {
        "sender_id": "doc-101",
        "sender_name": "Dr. Aris Thorne",
        "sender_role": "doctor",
        "recipient_id": "pat-001",
        "recipient_name": "Eleanor Vance",
        "record_type": "Cardiology Consultation Note",
        "record_id": "rep-test-auto-01",
        "payload": {
            "summary": "Target biomarkers evaluated against clinical baselines.",
            "chief_complaint": "Episodic chest palpitations post-exercise",
            "findings": "Resting ECG normal sinus rhythm. Holter monitor recommended.",
            "prescription": "Metoprolol 25mg PO daily",
            "physician": "Dr. Aris Thorne, MD"
        }
    }
    enc_resp = requests.post(f"{API_URL}/record/encrypt-pipeline", json=enc_payload)
    print(f"Encrypt Status: {enc_resp.status_code}")
    assert enc_resp.status_code == 200, f"Encryption failed: {enc_resp.text}"
    enc_data = enc_resp.json()
    assert enc_data["success"] is True, "Encryption pipeline did not succeed"
    
    envelope = enc_data["crypto_envelope"]
    print(f"Encrypted envelope created: Alg={envelope['algorithmSymmetric']}, KEM Alg={envelope['algorithmKem']}")
    
    # Now decrypt
    dec_payload = {
        "record_id": "rep-test-auto-01",
        "recipient_id": "pat-001",
        "recipient_role": "patient",
        "crypto_envelope": envelope,
        "simulate_tamper": False
    }
    dec_resp = requests.post(f"{API_URL}/record/decrypt-pipeline", json=dec_payload)
    print(f"Decrypt Status: {dec_resp.status_code}")
    assert dec_resp.status_code == 200, f"Decryption failed: {dec_resp.text}"
    dec_data = dec_resp.json()
    assert dec_data["success"] is True
    assert dec_data["verified"] is True
    assert dec_data["decrypted_record"] is not None
    assert dec_data["decrypted_record"]["chief_complaint"] == "Episodic chest palpitations post-exercise"
    print("[PASS] Test 2: Full End-to-End Encrypt & Decrypt round-trip succeeded!")

def test_3_tamper_simulation():
    print("\n--- TEST 3: Tamper Simulation (Bit-flip in Transit) ---")
    payload = {
        "record_id": "rep-9901",
        "recipient_id": "pat-001",
        "recipient_role": "patient",
        "simulate_tamper": True
    }
    resp = requests.post(f"{API_URL}/record/decrypt-pipeline", json=payload)
    print(f"Tamper Decrypt Status: {resp.status_code}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is False, "success MUST be False when tampered"
    assert data["verified"] is False, "verified MUST be False when tampered"
    assert data["decrypted_record"] is None, "Plaintext MUST NOT be released on tamper"
    
    # Verify Step 3 failed with GHASH message
    step_3 = next(s for s in data["steps_telemetry"] if s["step_number"] == 3)
    print(f"Step 3 Status: {step_3['status']}")
    print(f"Step 3 Error: {step_3.get('error')}")
    assert step_3["status"] == "FAILED"
    assert "GHASH" in step_3.get("error", "")
    assert "Poly1305" not in step_3.get("error", "")
    
    step_4 = next(s for s in data["steps_telemetry"] if s["step_number"] == 4)
    assert step_4["status"] == "FAILED"
    assert "Skipped" in step_4.get("error", "")
    
    step_6 = next(s for s in data["steps_telemetry"] if s["step_number"] == 6)
    assert step_6["status"] == "FAILED"
    print("[PASS] Test 3: Tamper simulation strictly failed-closed at Step 3 (GHASH).")

def test_4_wrong_recipient_key():
    print("\n--- TEST 4: Unauthorized Access (pat-002 attempts to access pat-001 record) ---")
    payload = {
        "record_id": "rep-9901",
        "recipient_id": "pat-002",  # Record rep-9901 belongs to pat-001
        "recipient_role": "patient",
        "simulate_tamper": False
    }
    resp = requests.post(f"{API_URL}/record/decrypt-pipeline", json=payload)
    print(f"Status Code: {resp.status_code}")
    assert resp.status_code == 403, f"Expected 403 Forbidden, got {resp.status_code}"
    print("[PASS] Blocked with 403 Forbidden by recipient boundary check.")

def test_5_tampered_ciphertext_direct():
    print("\n--- TEST 5: Direct Tampered Envelope (Altered Ciphertext) ---")
    envelope = {
        "algorithmKem": "ML-KEM-768 (NIST FIPS 203)",
        "algorithmSymmetric": "AES-256-GCM (NIST SP 800-38D)",
        "algorithmSignature": "ML-DSA-65 (NIST FIPS 204)",
        "ciphertext": "QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODk=",
        "iv": "MTIzNDU2Nzg5MDEy",
        "authTag": "MDEyMzQ1Njc4OTAxMjM0NQ==",
        "kemCiphertext": "QUJD" * 272,
        "pqcSignature": "U0lH" * 500,
        "signerPublicKey": "UEtFWQ==" * 300,
        "associatedData": "rec_id:fake|sender:doc-101|recipient:pat-001"
    }
    payload = {
        "record_id": "rep-fake-01",
        "recipient_id": "pat-001",
        "recipient_role": "patient",
        "crypto_envelope": envelope,
        "simulate_tamper": False
    }
    resp = requests.post(f"{API_URL}/record/decrypt-pipeline", json=payload)
    data = resp.json()
    assert data["success"] is False
    assert data["decrypted_record"] is None
    print("[PASS] Test 5: Corrupt ciphertext rejected; plaintext withheld.")

if __name__ == "__main__":
    test_1_decrypt_rep_9901()
    test_2_encrypt_and_decrypt_new_record()
    test_3_tamper_simulation()
    test_4_wrong_recipient_key()
    test_5_tampered_ciphertext_direct()
    print("\n=======================================================")
    print("ALL 5 CRYPTOGRAPHIC VERIFICATION SUITE TESTS PASSED 100%!")
    print("=======================================================")
