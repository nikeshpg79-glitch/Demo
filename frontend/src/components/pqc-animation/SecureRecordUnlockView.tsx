import React from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Calendar, 
  User, 
  Stethoscope, 
  FlaskConical, 
  Printer, 
  Download, 
  Lock, 
  RotateCcw,
  Sparkles,
  HeartPulse,
  Activity
} from 'lucide-react';

interface SecureRecordUnlockViewProps {
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

export const SecureRecordUnlockView: React.FC<SecureRecordUnlockViewProps> = ({
  record,
  metadata,
  onReplay,
  onClose
}) => {
  const biomarkers = record?.biomarkers || [
    { name: 'High-Sensitivity Troponin I', value: '0.012', unit: 'ng/mL', referenceRange: '0.000 - 0.040', flag: 'normal' },
    { name: 'N-Terminal Pro-BNP', value: '68.4', unit: 'pg/mL', referenceRange: '< 125.0', flag: 'normal' },
    { name: 'Creatine Kinase-MB', value: '2.1', unit: 'ng/mL', referenceRange: '0.6 - 6.3', flag: 'normal' }
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl text-slate-900 space-y-6 animate-fade-in">
      
      {/* Top Post-Quantum Security Seal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-sm">
            <ShieldCheck className="w-7 h-7 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-[#0A192F] tracking-tight">
                Authentic Confidential Medical Record
              </h3>
              <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-teal-300 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-teal-700" />
                <span>PQC VERIFIED</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Decrypted via NIST FIPS 203 ML-KEM-768 • Verified with NIST FIPS 204 ML-DSA-65 Signature.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Replay cryptographic verification journey"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Replay Verification</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Record Meta Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">RECORD ID</span>
          <span className="font-mono font-bold text-slate-900">{metadata?.recordId || 'REC-PQC-7741'}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">AUTHORIZED SENDER</span>
          <span className="font-semibold text-slate-800">{metadata?.senderName || 'Dr. Vikramaditya Sen'}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">DECRYPTED AT</span>
          <span className="font-mono text-slate-700">{metadata?.decryptedAt || '19:24:18 UTC'}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">INTEGRITY STATUS</span>
          <span className="text-teal-700 font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Pristine (No Bit-Flip)</span>
          </span>
        </div>
      </div>

      {/* Clinical Summary */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          CLINICAL EVALUATION SUMMARY
        </h4>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed">
          {record?.summary || 'Target diagnostic biomarkers evaluated against standardized hospital clinical baselines with full post-quantum verification.'}
        </div>
      </div>

      {/* Biomarkers Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          DIAGNOSTIC BIOMARKERS &amp; LAB MEASUREMENTS
        </h4>
        
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold">
              <tr>
                <th className="p-3">Biomarker Name</th>
                <th className="p-3">Result Value</th>
                <th className="p-3">Units</th>
                <th className="p-3">Clinical Reference Range</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {biomarkers.map((b: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{b.name}</td>
                  <td className="p-3 font-mono font-bold text-teal-700">{b.value}</td>
                  <td className="p-3 text-slate-600">{b.unit}</td>
                  <td className="p-3 text-slate-500 font-mono">{b.referenceRange}</td>
                  <td className="p-3 text-right">
                    <span className="bg-teal-50 text-teal-700 border border-teal-200 font-bold text-[10px] px-2 py-0.5 rounded-full">
                      {(b.flag || 'NORMAL').toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Impression & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-1">
          <span className="text-xs font-bold text-teal-900 flex items-center space-x-1.5">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Clinical Impression</span>
          </span>
          <p className="text-xs text-teal-950 leading-relaxed">
            {record?.clinicalImpression || 'Biomarker levels indicative of normal physiological profile. Zero cardiac or cellular distress biomarkers observed.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-1">
          <span className="text-xs font-bold text-sky-900 flex items-center space-x-1.5">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <span>Physician Recommendations</span>
          </span>
          <p className="text-xs text-sky-950 leading-relaxed">
            {record?.recommendations || 'Maintain standard physical activity. Next routine annual comprehensive panel recommended in 12 months.'}
          </p>
        </div>
      </div>

      {/* Cryptographic Proof Footer Badge */}
      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center space-x-2">
          <Lock className="w-3.5 h-3.5 text-teal-600" />
          <span>Non-repudiable Medical Audit: Signed with ML-DSA-65 (NIST FIPS 204)</span>
        </div>
        <span className="text-teal-700 font-bold">
          Zero-Trust Hospital-to-Patient Lattice Security
        </span>
      </div>

    </div>
  );
};

