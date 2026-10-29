# PQC-HEALTH: System Architecture & Cryptographic Specification

## 1. Executive Overview
The **PQC-HEALTH** platform addresses the critical vulnerability of modern healthcare communications: **Store Now, Decrypt Later (SNDL)**. Adversaries intercepting genomic profiles, blood biomarkers, and diagnostic notes encrypted with classical RSA or ECC can archive them today and decrypt them once cryptanalytically relevant quantum computers (CRQCs) running Shor's algorithm become operational.

---

## 2. Cryptographic Stack

| Primitive | Standard | Key Parameters | Function in System |
| :--- | :--- | :--- | :--- |
| **ML-KEM-768** | NIST FIPS 203 | 1184-byte Public Key, 1088-byte Ciphertext | Quantum-resistant Key Encapsulation Mechanism (KEM) to exchange 256-bit symmetric secrets between lab and hospital. |
| **AES-256-GCM** | NIST SP 800-38D | 256-bit Key, 96-bit IV, 128-bit Auth Tag | High-speed authenticated encryption of full biomarker panels and patient records. |
| **ML-DSA-65** | NIST FIPS 204 | 1952-byte Public Key, 3309-byte Signature | Quantum-safe lattice-based digital signatures guaranteeing technician non-repudiation and tamper prevention. |
| **QpiAI Quantum** | QpiAI SDK v0.7.5 | Hadamard + CNOT Entangled Circuit | Quantum Random Number Generation (QRNG) seed simulation and quantum threat modeling. |

---

## 3. Data Exchange Protocol (Lab ⇄ Hospital)

```
[ Hospital: Doctor ]                               [ Diagnostic Laboratory ]
        │                                                     │
 1. Creates Requisition ─────────────────────────────────────►│
    (Includes Doctor & Patient PQC PubKeys)                   │
        │                                              2. Performs Analysis
        │                                              3. Encapsulates 256-bit key via
        │                                                 ML-KEM-768 for Doctor & Patient
        │                                              4. Encrypts Biomarkers (AES-256-GCM)
        │                                              5. Signs Ciphertext (ML-DSA-65)
        │                                                     │
 6. Receives PQC Envelope ◄───────────────────────────────────┘
    • Decapsulates Session Key with Doctor Private Key
    • Verifies ML-DSA-65 Signature against Lab Public Key
    • Decrypts & Displays Verified Biomarkers
```

---

## 4. Zero-Trust Access Control (Database RLS)
* **Patients**: Can only access their own appointments, orders, and reports.
* **Doctors**: Restricted to records of patients with active consultations.
* **Lab Technicians**: Authorized to view open orders, submit reports, and sign envelopes.
* **Ciphertext Immutability**: Medical reports table has zero `UPDATE` or `DELETE` permissions to guarantee tamper-proof audit trails.
