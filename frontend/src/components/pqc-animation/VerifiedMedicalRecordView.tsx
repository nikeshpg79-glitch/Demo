import React from 'react';
import { SecureRecordUnlockView } from './SecureRecordUnlockView';

export interface VerifiedMedicalRecordViewProps {
  record: any;
  metadata?: {
    recordId: string;
    senderName: string;
    senderRole: string;
    decryptedAt: string;
    pqcSignatureVerified: boolean;
    authTagVerified: boolean;
  };
  onReplay?: () => void;
  onClose?: () => void;
}

export const VerifiedMedicalRecordView: React.FC<VerifiedMedicalRecordViewProps> = (props) => {
  return <SecureRecordUnlockView {...props} />;
};

export default VerifiedMedicalRecordView;

