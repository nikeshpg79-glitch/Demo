import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Key, 
  FileSignature, 
  HelpCircle, 
  Terminal, 
  Binary, 
  CheckCircle2,
  Lock,
  Cpu
} from 'lucide-react';

interface CryptographyStatusPanelProps {
  algorithmKem?: string;
  algorithmSymmetric?: string;
  algorithmSignature?: string;
  kemStatus?: string;
  aesStatus?: string;
  dsaStatus?: string;
  authTagStatus?: string;
  ivPreview?: string;
  keyFingerprint?: string;
}

export const CryptographyStatusPanel: React.FC<CryptographyStatusPanelProps> = ({
  algorithmKem = 'ML-KEM-768 (NIST FIPS 203)',
  algorithmSymmetric = 'AES-256-GCM (NIST SP 800-38D)',
  algorithmSignature = 'ML-DSA-65 (NIST FIPS 204)',
  kemStatus = 'Key Encapsulated & Derived',
  aesStatus = 'Authenticated GCM Cipher Active',
  dsaStatus = 'Lattice Signature Verified',
  authTagStatus = '128-bit Poly1305/GHASH Validated',
  ivPreview = '96-bit CSPRNG Nonce',
  keyFingerprint = 'LATTICE-M-LWE-768'
}) => {
  const [viewMode, setViewMode] = useState<'technical' | 'simple'>('technical');

  return (
    <div className="bg-[#0A192F] border border-cyan-500/25 rounded-2xl p-4 sm:p-5 text-white shadow-xl">
      
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
              Post-Quantum Cryptographic Stack
            </h4>
            <p className="text-[11px] text-slate-400">
              Zero-Trust Hospital ⇄ Laboratory Lattice Architecture
            </p>
          </div>
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('technical')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'technical'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center space-x-1">
              <Terminal className="w-3 h-3" />
              <span>Technical Details</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('simple')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'simple'
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center space-x-1">
              <HelpCircle className="w-3 h-3" />
              <span>Simple Explanation</span>
            </span>
          </button>
        </div>
      </div>

      {/* Content depending on viewMode */}
      {viewMode === 'technical' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          {/* Primitive 1: ML-KEM-768 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-teal-500/30 space-y-2">
            <div className="flex items-center justify-between text-teal-300 text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-bold">ML-KEM-768</span>
              </div>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">FIPS 203</span>
            </div>
            <div className="text-[11px] font-mono space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Hardness:</span>
                <span className="text-teal-200">Module-LWE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Public Key:</span>
                <span className="text-slate-200">1,184 Bytes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ciphertext:</span>
                <span className="text-slate-200">1,088 Bytes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shared Secret:</span>
                <span className="text-teal-300 font-bold">256-bit Derivation</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-teal-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{kemStatus}</span>
            </div>
          </div>

          {/* Primitive 2: AES-256-GCM */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-cyan-300 text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold">AES-256-GCM</span>
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">SP 800-38D</span>
            </div>
            <div className="text-[11px] font-mono space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Payload Cipher:</span>
                <span className="text-cyan-200">256-bit Counter</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unique IV:</span>
                <span className="text-slate-200">{ivPreview}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auth Tag:</span>
                <span className="text-cyan-300 font-bold">128-bit GHASH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SNDL Defense:</span>
                <span className="text-emerald-400">Grover-Resistant</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-cyan-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{authTagStatus}</span>
            </div>
          </div>

          {/* Primitive 3: ML-DSA-65 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-violet-500/30 space-y-2">
            <div className="flex items-center justify-between text-violet-300 text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                <FileSignature className="w-3.5 h-3.5 text-violet-400" />
                <span className="font-bold">ML-DSA-65</span>
              </div>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded">FIPS 204</span>
            </div>
            <div className="text-[11px] font-mono space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Hardness:</span>
                <span className="text-violet-200">Module-SIS Lattices</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Public Key:</span>
                <span className="text-slate-200">1,952 Bytes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signature Size:</span>
                <span className="text-violet-300 font-bold">3,309 Bytes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Non-Repudiation:</span>
                <span className="text-emerald-400">Technician Bound</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-violet-400 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{dsaStatus}</span>
            </div>
          </div>

        </div>
      ) : (
        /* Simple Explanation View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs text-slate-300">
          
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-teal-300 font-bold">
              <Key className="w-4 h-4 text-teal-400" />
              <span>1. Safe Handshake (ML-KEM)</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Before sending your medical report, the hospital uses future-proof mathematical lattices to establish an unbreakable temporary password with your device.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-bold">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>2. High-Speed Shield (AES-GCM)</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Your confidential blood results, doctor remarks, and sensitive diagnoses are sealed with military-grade 256-bit encryption. Even if intercepted, no one can read it.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-violet-300 font-bold">
              <FileSignature className="w-4 h-4 text-violet-400" />
              <span>3. Digital Stamp (ML-DSA)</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The attending doctor or lab technician signs the document with a digital seal. If a single letter or number is tampered with in transit, the system blocks the file.
            </p>
          </div>

        </div>
      )}

    </div>
  );
};

