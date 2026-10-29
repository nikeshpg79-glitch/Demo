import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Lock, 
  Unlock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Copy,
  Terminal,
  Cpu
} from 'lucide-react';
import { MedicalReport } from '../types';
import { dbService } from '../lib/dbService';
import { DecryptionTimelineModal } from './pqc-animation/DecryptionTimelineModal';

interface MedicalReportsViewProps {
  reports: MedicalReport[];
}

export const MedicalReportsView: React.FC<MedicalReportsViewProps> = ({ reports }) => {
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const [isDecrypted, setIsDecrypted] = useState<boolean>(true);
  const [tampered, setTampered] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [showDecryptionModal, setShowDecryptionModal] = useState<boolean>(false);

  const activeReport = reports.find((r) => r.id === selectedReportId) || reports[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runCryptoVerification = async (isTampered: boolean) => {
    setVerifying(true);
    const targetCiphertext = isTampered
      ? 'TAMPERED_PAYLOAD_XX_4jK8W199XzLqZ7==[UNAUTHORIZED_MODIFICATION_DETECTED]'
      : activeReport.cryptoEnvelope.ciphertext;

    const reportToCheck = {
      ...activeReport,
      cryptoEnvelope: {
        ...activeReport.cryptoEnvelope,
        ciphertext: targetCiphertext
      }
    };

    const res = await dbService.verifyReportSignature(reportToCheck);
    setVerificationResult(res);
    setVerifying(false);
  };



  if (!activeReport) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-slate-400">
        <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-base font-semibold">No medical reports found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* View Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-2">
            <Lock className="w-4 h-4 text-teal-600" />
            <span>NIST Post-Quantum Cryptographic Envelope</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#0A192F]">Medical Reports &amp; PQC Inspector</h2>
          <p className="text-slate-600 text-sm mt-1">
            Zero-knowledge cryptographic payload: ML-KEM-768 key encapsulation + AES-256-GCM + ML-DSA-65 signatures.
          </p>
        </div>

        {/* Report Selector Pill */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {reports.map((rep) => (
            <button
              key={rep.id}
              onClick={() => {
                setSelectedReportId(rep.id);
                setTampered(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeReport.id === rep.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {rep.id}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Report Content / Decrypted View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <span className="text-xs font-mono text-teal-600 font-bold bg-teal-50 px-2.5 py-0.5 rounded">
                  ORDER: {activeReport.orderId}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{activeReport.testTitle}</h3>
                <p className="text-xs text-slate-500">
                  Specimen: {activeReport.specimenType} • Timestamp: {new Date(activeReport.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Decrypt / Encrypt Toggle & Animation Trigger */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowDecryptionModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 text-slate-950 hover:opacity-95 shadow-md shadow-teal-500/20 flex items-center space-x-1.5 cursor-pointer uppercase tracking-wider transition-all"
                  title="Launch step-by-step post-quantum authenticated decryption journey"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Decrypt &amp; Verify (PQC)</span>
                </button>

                <button
                  onClick={() => setIsDecrypted(!isDecrypted)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isDecrypted
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-slate-900 text-teal-300 hover:bg-slate-800'
                  }`}
                >
                  {isDecrypted ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Decrypted Preview</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Show Ciphertext</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Content Display: Either Decrypted or Raw Ciphertext */}
            {isDecrypted && !tampered ? (
              <div className="space-y-6">
                {/* Clinical Summary */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Clinical Summary</h4>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                    {activeReport.decryptedData?.summary}
                  </p>
                </div>

                {/* Biomarkers Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Biomarker Measurements
                  </h4>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/75 text-slate-600 font-bold">
                        <tr>
                          <th className="p-3">Biomarker / Assay</th>
                          <th className="p-3">Result</th>
                          <th className="p-3">Reference Interval</th>
                          <th className="p-3">Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeReport.decryptedData?.biomarkers.map((bio, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-800">{bio.name}</td>
                            <td className="p-3 font-mono font-bold text-teal-700">
                              {bio.value} <span className="font-normal text-slate-400">{bio.unit}</span>
                            </td>
                            <td className="p-3 text-slate-500">{bio.referenceRange}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                bio.flag === 'high' ? 'bg-amber-100 text-amber-800' :
                                bio.flag === 'critical' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {bio.flag || 'Normal'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pathologist Impression */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pathologist Impression</h4>
                  <p className="text-xs text-slate-700 bg-teal-50/40 p-3.5 rounded-xl border border-teal-100 leading-relaxed">
                    {activeReport.decryptedData?.clinicalImpression}
                  </p>
                </div>
              </div>
            ) : (
              /* Raw Ciphertext View */
              <div className="space-y-4 font-mono text-xs">
                <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl space-y-2 overflow-x-auto">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                    <span>AES-256-GCM CIPHERTEXT (POST-QUANTUM PROTECTED)</span>
                    <span>1.4 KB</span>
                  </div>
                  <p className="break-all text-[11px] text-teal-300">
                    {tampered
                      ? 'TAMPERED_PAYLOAD_XX_4jK8W199XzLqZ7==[UNAUTHORIZED_MODIFICATION_DETECTED]'
                      : activeReport.cryptoEnvelope.ciphertext}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="bg-slate-900 text-slate-300 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Initialization Vector (96-bit IV):</span>
                    <span className="text-teal-400">{activeReport.cryptoEnvelope.iv}</span>
                  </div>
                  <div className="bg-slate-900 text-slate-300 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block">Authentication Tag (128-bit Tag):</span>
                    <span className="text-teal-400">{activeReport.cryptoEnvelope.authTag}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Signature Verification Footer with Real Cryptographic Check */}
            <div className={`p-5 rounded-2xl border flex flex-col space-y-3 ${
              verificationResult && !verificationResult.valid
                ? 'bg-red-50 border-red-300 text-red-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {verificationResult && !verificationResult.valid ? (
                    <ShieldAlert className="w-7 h-7 text-red-600 flex-shrink-0" />
                  ) : (
                    <ShieldCheck className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                  )}
                  <div>
                    <h5 className="font-bold text-sm">
                      {verificationResult && !verificationResult.valid
                        ? 'CRYPTOGRAPHIC TAMPER DETECTED (ML-DSA-65 FAILS)'
                        : 'NIST FIPS 204 Lattice Digital Signature'}
                    </h5>
                    <p className="text-xs opacity-90">
                      {verificationResult
                        ? verificationResult.message
                        : `Signed by ${activeReport.technicianName} using ML-DSA-65 private key.`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => runCryptoVerification(tampered)}
                    disabled={verifying}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0A192F] text-teal-300 hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {verifying ? 'Verifying with Backend...' : 'Verify Cryptographic Signature'}
                  </button>

                  <button
                    onClick={() => {
                      const nextTamper = !tampered;
                      setTampered(nextTamper);
                      setVerificationResult(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tampered
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tampered ? 'Restore Original Payload' : 'Simulate 1-Bit Payload Tamper'}
                  </button>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Right Col: Cryptographic Inspector Box */}
        <div className="space-y-6">
          <div className="bg-[#0A192F] text-white rounded-3xl p-6 border border-teal-500/30 shadow-xl space-y-5">
            <div className="flex items-center space-x-2 text-teal-400">
              <Terminal className="w-5 h-5" />
              <h4 className="font-bold text-sm tracking-wide uppercase">PQC Envelope Parameters</h4>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px]">KEM Standard:</span>
                <span className="text-teal-300 font-bold">{activeReport.cryptoEnvelope.algorithmKem}</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px]">Symmetric Cipher:</span>
                <span className="text-teal-300 font-bold">{activeReport.cryptoEnvelope.algorithmSymmetric}</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px]">Signature Standard:</span>
                <span className="text-teal-300 font-bold">{activeReport.cryptoEnvelope.algorithmSignature}</span>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">Doctor Encapsulated Key:</span>
                  <button
                    onClick={() => handleCopy(activeReport.cryptoEnvelope.kemCiphertextDoctor, 'docKey')}
                    className="text-teal-400 hover:text-teal-200 text-[10px] cursor-pointer"
                  >
                    {copiedKey === 'docKey' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-slate-300 text-[11px] truncate">{activeReport.cryptoEnvelope.kemCiphertextDoctor}</p>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">Patient Encapsulated Key:</span>
                  <button
                    onClick={() => handleCopy(activeReport.cryptoEnvelope.kemCiphertextPatient, 'patKey')}
                    className="text-teal-400 hover:text-teal-200 text-[10px] cursor-pointer"
                  >
                    {copiedKey === 'patKey' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-slate-300 text-[11px] truncate">{activeReport.cryptoEnvelope.kemCiphertextPatient}</p>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px]">Digital Signature Digest:</span>
                  <button
                    onClick={() => handleCopy(activeReport.cryptoEnvelope.pqcSignature, 'sig')}
                    className="text-teal-400 hover:text-teal-200 text-[10px] cursor-pointer"
                  >
                    {copiedKey === 'sig' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-slate-300 text-[11px] truncate">{activeReport.cryptoEnvelope.pqcSignature}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-snug">
              Protected against harvest-now-decrypt-later attacks for 50+ years of clinical privacy.
            </div>
          </div>
        </div>

      </div>

      {/* Patient Cryptographic Decryption Timeline Modal */}
      {showDecryptionModal && activeReport && (
        <DecryptionTimelineModal
          isOpen={showDecryptionModal}
          onClose={() => setShowDecryptionModal(false)}
          recordId={activeReport.id}
          recipientId={activeReport.patientId}
          recipientRole="patient"
          senderName={activeReport.doctorName || activeReport.technicianName}
          senderRole="doctor"
          cryptoEnvelope={activeReport.cryptoEnvelope}
        />
      )}
    </div>
  );
};
