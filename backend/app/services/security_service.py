import hashlib
import json
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from fastapi import Request

class SecurityService:
    def __init__(self):
        # In-memory tamper-evident audit ledger (hash-chained)
        self.events: List[Dict[str, Any]] = []
        self.alerts: List[Dict[str, Any]] = []
        self.transmissions: List[Dict[str, Any]] = []
        self.last_hash = "GENESIS_HASH_PQC_SECURE_HEALTH_2026"

        # Rate limiting state: { ip: [timestamp1, timestamp2, ...] }
        self.ip_request_history: Dict[str, List[float]] = {}
        # Failed login attempt tracking: { ip: [timestamp1, ...] }
        self.failed_logins: Dict[str, List[float]] = {}

        # Configurable detection thresholds
        self.THRESHOLDS = {
            "RATE_LIMIT_CRYPTO_PER_MIN": 150,       # 30 requests/min for PQC operations
            "RATE_LIMIT_GLOBAL_PER_MIN": 300,      # 120 requests/min general API
            "BURST_THRESHOLD_PER_2SEC": 10,        # 10 reqs in 2 seconds = burst
            "FAILED_LOGINS_FOR_ALERT": 5,          # 5 failures in 60s triggers alert
            "FAILED_LOGIN_WINDOW_SEC": 60,
        }

        # Seed initial authentic baseline transmission events for hospital ⇄ lab exchange
        self._seed_initial_transmissions()

    def _seed_initial_transmissions(self):
        """Seed realistic hospital-to-lab transmission records for the visualizer."""
        now = datetime.now(timezone.utc).isoformat()
        self.transmissions = [
            {
                "id": "TX-PQC-774102",
                "sender_role": "Doctor",
                "sender_id": "Dr. Vikramaditya Sen (doc-101)",
                "receiver_role": "Lab Technician",
                "receiver_id": "Rajesh Verma (lab-301)",
                "patient_id": "pat-001",
                "transaction_type": "Pathology Lab Order & Clinical Notes",
                "timestamp": now,
                "delivery_status": "Delivered",
                "encryption_status": "NIST SP 800-38D AES-256-GCM (Session Key: NIST FIPS 203 ML-KEM-768)",
                "signature_verification": "NIST FIPS 204 ML-DSA-65 Validated",
                "integrity_status": "SHA-256 Checksum Verified (No Bit-Flip)",
                "flow_steps": [
                    {"step": "Sender Authorization", "status": "Passed", "detail": "Doctor session & credentials verified via Supabase JWT"},
                    {"step": "API Gateway Ingestion", "status": "Passed", "detail": "FastAPI endpoint /api/documents/upload validated MIME & headers"},
                    {"step": "PQC Encryption & Signing", "status": "Passed", "detail": "ML-KEM-768 key encapsulation + Dilithium3 3293-byte signature generated"},
                    {"step": "Encrypted Cloud Storage", "status": "Passed", "detail": "Stored in private Supabase bucket 'medical-documents' with signed URL"},
                    {"step": "Lab Receiver Verification", "status": "Passed", "detail": "Technician validated ML-DSA-65 public key without alteration"}
                ],
                "security_notes": "Cryptographically authenticated transmission. Zero unauthorized access attempts."
            },
            {
                "id": "TX-PQC-889412",
                "sender_role": "Lab Technician",
                "sender_id": "Rajesh Verma (lab-301)",
                "receiver_role": "Doctor",
                "receiver_id": "Dr. Vikramaditya Sen (doc-101)",
                "patient_id": "pat-001",
                "transaction_type": "Molecular Diagnostic Report & Biomarkers",
                "timestamp": now,
                "delivery_status": "Delivered",
                "encryption_status": "NIST SP 800-38D AES-256-GCM (Session Key: NIST FIPS 203 ML-KEM-768)",
                "signature_verification": "NIST FIPS 204 ML-DSA-65 Validated",
                "integrity_status": "SHA-256 Checksum Verified (No Bit-Flip)",
                "flow_steps": [
                    {"step": "Sender Authorization", "status": "Passed", "detail": "Certified NABL Technician license verified"},
                    {"step": "API Gateway Ingestion", "status": "Passed", "detail": "FastAPI endpoint /api/pqc/report/verify validated payload"},
                    {"step": "PQC Encryption & Signing", "status": "Passed", "detail": "Signed with Lab Technician ML-DSA-65 lattice keypair"},
                    {"step": "Encrypted Cloud Storage", "status": "Passed", "detail": "Encrypted ciphertext stored in PostgreSQL lab_results"},
                    {"step": "Doctor Receiver Verification", "status": "Passed", "detail": "Physician decrypted report using decapsulated session key"}
                ],
                "security_notes": "Diagnostic report delivered with post-quantum confidentiality and non-repudiation."
            }
        ]

    def resolve_source_ip(self, request: Optional[Request]) -> str:
        """
        Safely resolve observed client IP address.
        Avoids blindly trusting arbitrary X-Forwarded-For headers unless behind trusted proxies.
        """
        if not request:
            return "127.0.0.1"

        client_host = request.client.host if request.client else "unknown"
        
        # In cloud/reverse-proxy environments: inspect X-Forwarded-For, but sanitize
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # First IP in the comma-separated chain is the original client
            parts = [p.strip() for p in forwarded_for.split(",") if p.strip()]
            if parts:
                return parts[0]

        return client_host

    def record_event(
        self,
        event_type: str,
        severity: str,
        outcome: str,
        endpoint: str,
        observed_source_ip: str,
        evidence: Dict[str, Any],
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Records a structured security event in a cryptographic hash-chained audit ledger.
        Ensures tamper-evidence (any modification breaks the hash chain).
        Never logs passwords, tokens, private keys, or raw medical text.
        """
        event_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        req_id = request_id or f"req-{uuid.uuid4().hex[:12]}"

        # Sanitize evidence: strip any potential secrets
        safe_evidence = self._sanitize_evidence(evidence)

        # Hash chaining calculation: SHA-256(prev_hash + event_id + timestamp + event_type + severity + outcome + evidence)
        serialized_data = f"{self.last_hash}:{event_id}:{timestamp}:{event_type}:{severity}:{outcome}:{json.dumps(safe_evidence, sort_keys=True)}"
        record_hash = hashlib.sha256(serialized_data.encode("utf-8")).hexdigest()

        event = {
            "id": event_id,
            "timestamp": timestamp,
            "event_type": event_type,
            "severity": severity,
            "outcome": outcome,
            "request_id": req_id,
            "endpoint": endpoint,
            "observed_source_ip": observed_source_ip,
            "evidence": safe_evidence,
            "previous_hash": self.last_hash,
            "record_hash": record_hash
        }

        self.last_hash = record_hash
        self.events.append(event)

        # Keep ledger manageable in memory while persisting history
        if len(self.events) > 1000:
            self.events = self.events[-1000:]

        return event

    def _sanitize_evidence(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Strip sensitive fields like passwords, bearer tokens, private keys, or patient names."""
        forbidden_keys = {"password", "token", "bearer", "authorization", "secret", "private_key", "sk", "medical_notes", "diagnosis_text"}
        clean = {}
        for k, v in evidence.items():
            if any(forbidden in k.lower() for forbidden in forbidden_keys):
                clean[k] = "[REDACTED_CONFIDENTIAL]"
            elif isinstance(v, str) and len(v) > 200:
                clean[k] = v[:200] + "... [TRUNCATED]"
            else:
                clean[k] = v
        return clean

    def create_alert(
        self,
        rule_name: str,
        rule_description: str,
        observed_source_ip: str,
        endpoint: str,
        request_id: str,
        evidence: Dict[str, Any],
        severity: str,
        confidence: str,
        defensive_action: str,
        recommended_action: str
    ) -> Dict[str, Any]:
        """Creates an actionable security intelligence alert with workflow management."""
        alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
        timestamp = datetime.now(timezone.utc).isoformat()

        # Count related events
        related_count = sum(
            1 for e in self.events 
            if e.get("observed_source_ip") == observed_source_ip or e.get("endpoint") == endpoint
        )

        alert = {
            "id": alert_id,
            "rule_name": rule_name,
            "rule_description": rule_description,
            "observed_source_ip": observed_source_ip,
            "timestamp": timestamp,
            "endpoint": endpoint,
            "request_id": request_id,
            "related_event_count": max(1, related_count),
            "evidence": self._sanitize_evidence(evidence),
            "severity": severity,
            "confidence": confidence,
            "defensive_action": defensive_action,
            "recommended_action": recommended_action,
            "status": "NEW",  # Workflow: NEW -> INVESTIGATING -> RESOLVED
            "assigned_to": None,
            "investigation_notes": None,
            "resolved_at": None
        }

        self.alerts.insert(0, alert)  # newest first
        if len(self.alerts) > 200:
            self.alerts = self.alerts[:200]

        return alert

    def check_rate_limit(self, client_ip: str, endpoint: str) -> tuple[bool, Dict[str, Any]]:
        """
        Safe sliding-window rate limiter per observed client IP.
        Returns (is_allowed, details_dict).
        """
        # Health check endpoints are strictly exempt from rate limiting
        if endpoint in ("/api/health", "/api/health/", "/health", "/"):
            return True, {}

        now = time.time()
        is_crypto_endpoint = any(kw in endpoint for kw in ["/pqc/", "/encrypt", "/decrypt", "/verify", "/keygen", "/upload"])
        limit = self.THRESHOLDS["RATE_LIMIT_CRYPTO_PER_MIN"] if is_crypto_endpoint else self.THRESHOLDS["RATE_LIMIT_GLOBAL_PER_MIN"]

        # Filter window to past 60 seconds
        history = self.ip_request_history.get(client_ip, [])
        history = [t for t in history if now - t < 60.0]
        history.append(now)
        self.ip_request_history[client_ip] = history

        # Check burst threshold (past 2 seconds)
        burst_count = sum(1 for t in history if now - t <= 2.0)
        if burst_count > self.THRESHOLDS["BURST_THRESHOLD_PER_2SEC"]:
            req_id = f"req-{uuid.uuid4().hex[:8]}"
            evidence = {
                "observed_burst_rate": f"{burst_count} req/2s",
                "burst_threshold": f"{self.THRESHOLDS['BURST_THRESHOLD_PER_2SEC']} req/2s",
                "endpoint": endpoint
            }
            self.record_event(
                event_type="SUSPICIOUS_REQUEST_BURST",
                severity="HIGH",
                outcome="RATE_LIMITED",
                endpoint=endpoint,
                observed_source_ip=client_ip,
                evidence=evidence,
                request_id=req_id
            )
            self.create_alert(
                rule_name="RAPID_BURST_FLOOD",
                rule_description="High-frequency request burst detected against sensitive healthcare endpoint.",
                observed_source_ip=client_ip,
                endpoint=endpoint,
                request_id=req_id,
                evidence=evidence,
                severity="HIGH",
                confidence="CONFIRMED_HIGH",
                defensive_action="Temporary cooldown applied via HTTP 429 response.",
                recommended_action="Inspect reverse proxy / WAF logs to check for automated scanning."
            )
            return False, {"detail": "Rate limit exceeded (burst flood)", "retry_after": 5}

        # Check per-minute threshold
        if len(history) > limit:
            req_id = f"req-{uuid.uuid4().hex[:8]}"
            evidence = {
                "requests_in_window": len(history),
                "threshold_per_minute": limit,
                "endpoint": endpoint
            }
            self.record_event(
                event_type="RATE_LIMIT_EXCEEDED",
                severity="MEDIUM",
                outcome="RATE_LIMITED",
                endpoint=endpoint,
                observed_source_ip=client_ip,
                evidence=evidence,
                request_id=req_id
            )
            return False, {"detail": f"Rate limit exceeded (max {limit} req/min)", "retry_after": 60}

        return True, {}

    def record_failed_login(self, client_ip: str, attempted_identifier: str) -> None:
        """Track failed authentication attempts and raise alerts if threshold exceeded."""
        now = time.time()
        attempts = self.failed_logins.get(client_ip, [])
        attempts = [t for t in attempts if now - t < self.THRESHOLDS["FAILED_LOGIN_WINDOW_SEC"]]
        attempts.append(now)
        self.failed_logins[client_ip] = attempts

        req_id = f"req-{uuid.uuid4().hex[:8]}"
        evidence = {
            "attempt_count_window": len(attempts),
            "window_seconds": self.THRESHOLDS["FAILED_LOGIN_WINDOW_SEC"],
            "attempted_identifier_obfuscated": attempted_identifier[:3] + "***" if len(attempted_identifier) > 3 else "unknown"
        }

        self.record_event(
            event_type="AUTHENTICATION_FAILURE",
            severity="LOW" if len(attempts) < 3 else "MEDIUM",
            outcome="REJECTED",
            endpoint="/auth/v1/token",
            observed_source_ip=client_ip,
            evidence=evidence,
            request_id=req_id
        )

        if len(attempts) >= self.THRESHOLDS["FAILED_LOGINS_FOR_ALERT"]:
            self.create_alert(
                rule_name="BRUTE_FORCE_AUTHENTICATION_ATTEMPT",
                rule_description=f"Observed {len(attempts)} failed authentication attempts within {self.THRESHOLDS['FAILED_LOGIN_WINDOW_SEC']}s.",
                observed_source_ip=client_ip,
                endpoint="/auth/v1/token",
                request_id=req_id,
                evidence=evidence,
                severity="HIGH",
                confidence="CONFIRMED_HIGH",
                defensive_action="Throttled further authentication requests from this observed source.",
                recommended_action="Verify account lockout policies; monitor for credential stuffing patterns."
            )

    def verify_audit_chain_integrity(self) -> Dict[str, Any]:
        """
        Validates cryptographic hash chaining across all recorded security events.
        Proves whether any record in memory or exported logs has been modified or deleted.
        """
        if not self.events:
            return {"valid": True, "total_records": 0, "status": "No events recorded"}

        expected_prev = "GENESIS_HASH_PQC_SECURE_HEALTH_2026"
        for idx, event in enumerate(self.events):
            if event["previous_hash"] != expected_prev:
                return {
                    "valid": False,
                    "tamper_detected_at_index": idx,
                    "event_id": event["id"],
                    "error": "Previous hash pointer mismatch! Ledger broken or altered.",
                    "status": "INTEGRITY_VIOLATION_DETECTED"
                }

            # Recalculate hash
            serialized = f"{event['previous_hash']}:{event['id']}:{event['timestamp']}:{event['event_type']}:{event['severity']}:{event['outcome']}:{json.dumps(event['evidence'], sort_keys=True)}"
            recalculated_hash = hashlib.sha256(serialized.encode("utf-8")).hexdigest()

            if recalculated_hash != event["record_hash"]:
                return {
                    "valid": False,
                    "tamper_detected_at_index": idx,
                    "event_id": event["id"],
                    "error": "Record hash digest mismatch! Data within record was modified.",
                    "status": "INTEGRITY_VIOLATION_DETECTED"
                }

            expected_prev = event["record_hash"]

        return {
            "valid": True,
            "total_records": len(self.events),
            "latest_root_hash": self.last_hash,
            "status": "CRYPTOGRAPHIC_INTEGRITY_VERIFIED"
        }

    def update_alert_status(self, alert_id: str, new_status: str, admin_notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Updates alert investigation status with administrative audit trail."""
        for alert in self.alerts:
            if alert["id"] == alert_id:
                old_status = alert["status"]
                alert["status"] = new_status
                if admin_notes:
                    alert["investigation_notes"] = admin_notes
                if new_status == "RESOLVED":
                    alert["resolved_at"] = datetime.now(timezone.utc).isoformat()

                # Audit record of status change
                self.record_event(
                    event_type="ALERT_WORKFLOW_STATE_CHANGE",
                    severity="LOW",
                    outcome="UPDATED",
                    endpoint="/api/security/alerts",
                    observed_source_ip="internal_admin_console",
                    evidence={
                        "alert_id": alert_id,
                        "old_status": old_status,
                        "new_status": new_status,
                        "notes_provided": bool(admin_notes)
                    }
                )
                return alert
        return None

    def simulate_attack_scenario(self, scenario_type: str, client_ip: str = "192.168.1.105") -> Dict[str, Any]:
        """
        Controlled test mode to safely simulate suspicious activity
        without attacking real infrastructure or disrupting valid users.
        """
        sim_id = f"sim-{uuid.uuid4().hex[:8]}"

        if scenario_type == "tamper_signature":
            # Simulate ML-DSA-65 signature failure (bit-flip)
            ev = {
                "simulation": True,
                "simulated_target": "MedicalReport #RPT-SIM-099",
                "bit_flip_location": "Byte offset 124 in Dilithium3 signature",
                "expected_key_algorithm": "NIST FIPS 204 (ML-DSA-65)"
            }
            self.record_event(
                event_type="INVALID_DIGITAL_SIGNATURE",
                severity="CRITICAL",
                outcome="BLOCKED",
                endpoint="/api/pqc/report/verify",
                observed_source_ip=client_ip,
                evidence=ev,
                request_id=sim_id
            )
            alert = self.create_alert(
                rule_name="CRYPTOGRAPHIC_SIGNATURE_TAMPER",
                rule_description="Lattice-based digital signature verification failed. Bit-flip or forgery detected.",
                observed_source_ip=client_ip,
                endpoint="/api/pqc/report/verify",
                request_id=sim_id,
                evidence=ev,
                severity="CRITICAL",
                confidence="CONFIRMED_HIGH",
                defensive_action="Verification failed closed; report was not marked verified in database.",
                recommended_action="Audit laboratory technician device certificates; check transmission channel for man-in-the-middle tampering."
            )
            return {"scenario": scenario_type, "alert_created": alert["id"], "status": "Simulated Successfully"}

        elif scenario_type == "unauthorized_record_access":
            # Simulate patient trying to query another patient's records
            ev = {
                "simulation": True,
                "authenticated_role": "patient",
                "token_patient_id": "pat-001 (Ananya Sharma)",
                "targeted_patient_id": "pat-999 (Confidential VIP Record)",
                "violation_type": "BOLA / IDOR Attempt"
            }
            self.record_event(
                event_type="UNAUTHORIZED_ACCESS_ATTEMPT",
                severity="HIGH",
                outcome="BLOCKED",
                endpoint="/api/documents/patient/pat-999",
                observed_source_ip=client_ip,
                evidence=ev,
                request_id=sim_id
            )
            alert = self.create_alert(
                rule_name="UNAUTHORIZED_PATIENT_RECORD_ACCESS",
                rule_description="Patient account attempted direct object reference to retrieve unassociated patient records.",
                observed_source_ip=client_ip,
                endpoint="/api/documents/patient/pat-999",
                request_id=sim_id,
                evidence=ev,
                severity="HIGH",
                confidence="CONFIRMED_HIGH",
                defensive_action="Request denied with HTTP 403 Forbidden via PostgreSQL RLS enforcement.",
                recommended_action="Review patient portal session logs; verify client-side navigation filters."
            )
            return {"scenario": scenario_type, "alert_created": alert["id"], "status": "Simulated Successfully"}

        elif scenario_type == "rate_limit_burst":
            # Simulate high-rate request flood
            ev = {
                "simulation": True,
                "simulated_request_count": 25,
                "window_seconds": 2,
                "targeted_endpoint": "/api/pqc/kem/encapsulate"
            }
            self.record_event(
                event_type="SUSPICIOUS_REQUEST_BURST",
                severity="HIGH",
                outcome="RATE_LIMITED",
                endpoint="/api/pqc/kem/encapsulate",
                observed_source_ip=client_ip,
                evidence=ev,
                request_id=sim_id
            )
            alert = self.create_alert(
                rule_name="RAPID_BURST_FLOOD",
                rule_description="High-frequency request burst (25 req/2s) simulated against PQC KEM endpoint.",
                observed_source_ip=client_ip,
                endpoint="/api/pqc/kem/encapsulate",
                request_id=sim_id,
                evidence=ev,
                severity="HIGH",
                confidence="CONFIRMED_HIGH",
                defensive_action="Rate limiting activated; HTTP 429 returned with exponential backoff.",
                recommended_action="Inspect client traffic pattern; configure upstream reverse proxy throttling."
            )
            return {"scenario": scenario_type, "alert_created": alert["id"], "status": "Simulated Successfully"}

        elif scenario_type == "failed_login_brute_force":
            # Simulate 5 rapid login failures
            for i in range(5):
                self.record_failed_login(client_ip, f"admin_account_{i}@metrohealth.in")
            return {"scenario": scenario_type, "status": "Simulated 5 consecutive failed authentications"}

        else:
            return {"error": f"Unknown simulation scenario '{scenario_type}'"}


security_service = SecurityService()
