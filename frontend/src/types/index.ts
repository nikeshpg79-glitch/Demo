export type UserRole = 'patient' | 'doctor' | 'lab_technician' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  licenseNumber?: string;
  avatarUrl?: string;
  pqcPublicKey?: string; // ML-KEM-768 public key (Base64)
  pqcDsaPublicKey?: string; // ML-DSA-65 public key (Base64)
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  experienceYears: number;
  hospital: string;
  rating: number;
  reviewsCount: number;
  availableDays: string[];
  consultationFee: string;
  pqcKeyFingerprint: string;
  avatar: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  scheduledFor: string;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
  notes?: string;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  labTechnicianId?: string;
  labTechnicianName?: string;
  testType: string;
  priority: 'routine' | 'urgent' | 'stat_emergency';
  clinicalNotes: string;
  status: 'pending' | 'sample_collected' | 'in_analysis' | 'completed' | 'rejected';
  createdAt: string;
}

export interface MedicalReport {
  id: string;
  orderId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  technicianId: string;
  technicianName: string;
  testTitle: string;
  specimenType: string;
  createdAt: string;
  
  // Cleartext payload for authorized decrypted preview
  decryptedData?: {
    summary: string;
    biomarkers: { name: string; value: string; unit: string; referenceRange: string; flag?: 'normal' | 'high' | 'critical' }[];
    clinicalImpression: string;
    recommendations: string;
  };

  // Cryptographic Envelope (NIST PQC Standards)
  cryptoEnvelope: {
    algorithmKem: 'ML-KEM-768 (NIST FIPS 203)';
    algorithmSymmetric: 'AES-256-GCM (NIST SP 800-38D)';
    algorithmSignature: 'ML-DSA-65 (NIST FIPS 204)';
    ciphertext: string; // Base64
    iv: string; // 96-bit Base64
    authTag: string; // 128-bit Base64
    kemCiphertextDoctor: string; // Base64
    kemCiphertextPatient: string; // Base64
    pqcSignature: string; // Base64
    signerPublicKey: string; // Base64
    associatedData?: string;
    kemCiphertext?: string;
    verified: boolean;
  };
}

export type DocumentCategory = 
  | 'Prescription' 
  | 'Medical Scan' 
  | 'Blood Test' 
  | 'Diagnosis Report' 
  | 'Referral' 
  | 'Other Medical Document';

export interface MedicalDocument {
  id: string;
  patientId: string;
  patientName?: string;
  uploadedBy: string;
  uploaderName?: string;
  uploaderRole: UserRole;
  appointmentId?: string;
  orderId?: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  fileHashSha256: string;
  pqcSignature?: string;
  signerPublicKey?: string;
  isVerified: boolean;
  createdAt: string;
  signedUrl: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  outcome: 'BLOCKED' | 'REJECTED' | 'FLAGGED' | 'RATE_LIMITED' | 'ALLOWED' | 'UPDATED';
  request_id: string;
  endpoint: string;
  observed_source_ip: string;
  evidence: Record<string, any>;
  previous_hash: string;
  record_hash: string;
}

export interface SecurityAlert {
  id: string;
  rule_name: string;
  rule_description: string;
  observed_source_ip: string;
  timestamp: string;
  endpoint: string;
  request_id: string;
  related_event_count: number;
  evidence: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: 'CONFIRMED_HIGH' | 'PROBABLE_MEDIUM' | 'LOW';
  defensive_action: string;
  recommended_action: string;
  status: 'NEW' | 'INVESTIGATING' | 'RESOLVED';
  investigation_notes?: string;
  resolved_at?: string;
}

export interface TransmissionFlowStep {
  step: string;
  status: 'Passed' | 'Failed' | 'Pending';
  detail: string;
}

export interface TransmissionRecord {
  id: string;
  sender_role: string;
  sender_id: string;
  receiver_role: string;
  receiver_id: string;
  patient_id?: string;
  transaction_type: string;
  timestamp: string;
  delivery_status: 'Delivered' | 'Stored Securely' | 'In Transit' | 'Pending';
  encryption_status: string;
  signature_verification: string;
  integrity_status: string;
  flow_steps?: TransmissionFlowStep[];
  security_notes: string;
}
