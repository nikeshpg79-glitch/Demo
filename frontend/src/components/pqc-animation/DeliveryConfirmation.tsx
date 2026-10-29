import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowRight, 
  RotateCcw, 
  Lock, 
  FileText, 
  Share2,
  Calendar,
  Sparkles
} from 'lucide-react';

export interface DeliveryConfirmationProps {
  recordReference: string;
  transmissionId?: string;
  recipientName: string;
  recipientId: string;
  senderRole: 'doctor' | 'lab_technician';
  deliveredAt: string;
  auditHash?: string;
  onReturnToDashboard: () => void;
  onReplay?: () => void;
}

export const DeliveryConfirmation: React.FC<DeliveryConfirmationProps> = ({
  recordReference,
  transmissionId,
  recipientName,
  recipientId,
  senderRole,
  deliveredAt,
  auditHash,
  onReturnToDashboard,
  onReplay
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(recordReference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const nameParts = recipientName.trim().split(' ');
  const maskedName = nameParts.length > 1
    ? `${nameParts[0][0]}*** ${nameParts[nameParts.length - 1][0]}***`
    : `${recipientName.slice(0, 2)}***`;

  return (
    <div className="bg-[#071324] rounded-2xl p-5 sm:p-6 border border-emerald-500/30 text-white space-y-5 animate-fade-in shadow-xl">
      
      {/* Top Banner with Seal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Record Sealed &amp; Delivered
              </h3>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                VERIFIED SEAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely placed into patient's confidential inbox with post-quantum end-to-end protection
            </p>
          </div>
        </div>

        {/* Copy Reference Pill */}
        <button
          type="button"
          onClick={handleCopyRef}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-teal-500 text-xs font-mono text-slate-300 hover:text-white flex items-center space-x-2 transition-colors cursor-pointer"
          title="Copy record reference"
        >
          <span>{recordReference}</span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
        </button>
      </div>

      {/* Grid of Delivery Metadata */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Recipient</span>
          <span className="font-bold text-slate-200 truncate block mt-0.5">{maskedName}</span>
          <span className="text-[10px] text-teal-400 font-normal">ID: {recipientId.slice(0, 4)}***</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Sender Authority</span>
          <span className="font-bold text-slate-200 block mt-0.5 uppercase">{senderRole.replace('_', ' ')}</span>
          <span className="text-[10px] text-emerald-400 font-normal">ML-DSA Signed</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Key Establishment</span>
          <span className="font-bold text-teal-300 block mt-0.5">ML-KEM-768</span>
          <span className="text-[10px] text-slate-400 font-normal">FIPS 203 Sealed</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Delivery Time</span>
          <span className="font-bold text-slate-200 block mt-0.5">{deliveredAt}</span>
          <span className="text-[10px] text-cyan-400 font-normal">Audit Recorded</span>
        </div>
      </div>

      {/* Audit Trail Evidence */}
      {auditHash && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-semibold">SHA-256 Tamper-Evident Audit Hash:</span>
            <span className="text-emerald-400 font-bold">IMMUTABLE</span>
          </div>
          <p className="text-teal-300 text-[10px] break-all select-all bg-slate-900 p-1.5 rounded border border-slate-800">
            {auditHash}
          </p>
        </div>
      )}

      {/* Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {onReplay && (
          <button
            type="button"
            onClick={onReplay}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Replay Visualization (Safe)</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReturnToDashboard}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-400 hover:opacity-95 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer ml-auto"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>

    </div>
  );
};

