import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Cpu, 
  FileText, 
  Key, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileSignature,
  Building2,
  Calendar,
  X
} from 'lucide-react';

export interface SecureSendConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  senderName: string;
  senderRole: 'doctor' | 'lab_technician';
  senderDepartment?: string;
  recipientName: string;
  recipientId: string;
  recordType: string;
  recordReference: string;
  payloadSummary: {
    title: string;
    itemsCount: number;
    clinicalSummary: string;
  };
}

export const SecureSendConfirmation: React.FC<SecureSendConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  senderName,
  senderRole,
  senderDepartment = senderRole === 'doctor' ? 'Clinical Medicine' : 'Diagnostic Pathology',
  recipientName,
  recipientId,
  recordType,
  recordReference,
  payloadSummary
}) => {
  if (!isOpen) return null;

  // Masked PII calculations
  const nameParts = recipientName.trim().split(' ');
  const maskedName = nameParts.length > 1
    ? `${nameParts[0][0]}*** ${nameParts[nameParts.length - 1][0]}***`
    : `${recipientName.slice(0, 2)}***`;
  const maskedId = recipientId.length > 4 ? `${recipientId.slice(0, 4)}***` : 'pat-***';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="secure-send-preview-title"
    >
      <div className="bg-[#0A192F] rounded-3xl max-w-2xl w-full shadow-2xl border border-teal-500/30 relative overflow-hidden flex flex-col text-white my-auto">
        
        {/* Glow Ambient Highlights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#1E293B] flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
              <ShieldCheck className="w-6 h-6 text-[#0A192F]" />
            </div>
            <div>
              <h3 id="secure-send-preview-title" className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Secure-Send Cryptographic Preview</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono font-bold border border-teal-500/30 uppercase">
                  NIST FIPS 203/204
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review verified cryptographic parameters before committing post-quantum encryption
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh] relative z-10">
          
          {/* 1. Sender & Recipient Security Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Sender Station */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Authenticated Sender</span>
                </span>
                <span className="text-[10px] font-mono text-teal-400 font-bold uppercase">
                  {senderRole === 'doctor' ? 'PHYSICIAN' : 'LABORATORY'}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-white truncate">{senderName}</p>
                <p className="text-xs text-slate-400 truncate">{senderDepartment}</p>
              </div>
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-teal-300">
                <span>ML-DSA-65 Signing Key:</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Verified Active</span>
                </span>
              </div>
            </div>

            {/* Recipient Station */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center space-x-1.5 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Target Recipient</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                  PATIENT
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-white truncate">{maskedName}</p>
                <p className="text-xs text-slate-400 font-mono">ID: {maskedId}</p>
              </div>
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                <span>ML-KEM-768 Public Key:</span>
                <span className="text-emerald-400 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Enrolled &amp; Valid</span>
                </span>
              </div>
            </div>

          </div>

          {/* 2. Record Summary Details */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Record Metadata
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Ref: <span className="text-teal-300 font-semibold">{recordReference}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Record Type</span>
                <span className="font-semibold text-slate-200 truncate block mt-0.5">{recordType}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block">Payload Structure</span>
                <span className="font-semibold text-slate-200 block mt-0.5">{payloadSummary.itemsCount} clinical parameters</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
              <span className="text-[10px] text-slate-400 block">Clinical Summary</span>
              <p className="text-slate-300 text-xs mt-0.5 line-clamp-2">
                {payloadSummary.clinicalSummary}
              </p>
            </div>
          </div>

          {/* 3. Cryptographic Pipeline Specification */}
          <div className="p-4 rounded-2xl bg-[#071324] border border-teal-500/20 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-teal-300">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-teal-400" />
                <span>Active Cryptographic Suite</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">ALL ENGINES ONLINE</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">Key Encapsulation</span>
                <span className="text-teal-300 font-bold">ML-KEM-768</span>
                <span className="text-[9px] text-slate-500 block">FIPS 203</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">Symmetric Cipher</span>
                <span className="text-cyan-300 font-bold">AES-256-GCM</span>
                <span className="text-[9px] text-slate-500 block">SP 800-38D</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-center">
                <span className="text-slate-400 text-[10px] block">Digital Signature</span>
                <span className="text-violet-300 font-bold">ML-DSA-65</span>
                <span className="text-[9px] text-slate-500 block">FIPS 204</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              • The record payload will be encrypted with a unique session key encapsulated via ML-KEM-768.<br />
              • Non-repudiation is guaranteed by your cryptographic ML-DSA-65 signature before transmission.
            </p>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="p-5 sm:p-6 border-t border-[#1E293B] bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Back &amp; Edit Details
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 hover:opacity-95 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-slate-950" />
            <span>Encrypt &amp; Send Securely</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>

      </div>
    </div>
  );
};

