export type StepState = 'pending' | 'in_progress' | 'completed' | 'failed' | 'not_configured';

export interface WorkflowStep {
  id: number;
  name: string;
  shortDescription: string;
  technicalDescription: string;
  standard?: string;
  status: StepState;
  timestamp?: string;
  details?: Record<string, any>;
  errorMessage?: string;
}

export interface EncryptionPipelineTelemetry {
  recordId: string;
  transmissionId: string;
  recipientId: string;
  recipientName: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recordType: string;
  timestamp: string;
  steps: WorkflowStep[];
  cryptoEnvelope: {
    algorithmKem: string;
    algorithmSymmetric: string;
    algorithmSignature: string;
    ciphertext: string;
    iv: string;
    authTag: string;
    kemCiphertext: string;
    pqcSignature: string;
    signerPublicKey: string;
    associatedData: string;
  };
}

export interface DecryptionPipelineTelemetry {
  recordId: string;
  recipientId: string;
  verified: boolean;
  steps: WorkflowStep[];
  decryptedRecord?: any;
  metadata?: {
    recordId: string;
    senderName: string;
    senderRole: string;
    decryptedAt: string;
    pqcSignatureVerified: boolean;
    authTagVerified: boolean;
  };
  errorMessage?: string;
}

