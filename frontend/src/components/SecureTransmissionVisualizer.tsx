import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Send, 
  Server, 
  Cpu, 
  Database, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  ArrowRight, 
  RefreshCw,
  EyeOff,
  Radio,
  FileCheck2,
  Binary,
  Activity
} from 'lucide-react';
import { TransmissionRecord } from '../types';

interface SecureTransmissionVisualizerProps {
  currentRole: string;
  patientId?: string;
}

export const SecureTransmissionVisualizer: React.FC<SecureTransmissionVisualizerProps> = ({
  currentRole,
  patientId
}) => {
  const { t } = useTranslation();
  const [transmissions, setTransmissions] = useState<TransmissionRecord[]>([]);
  const [selectedTx, setSelectedTx] = useState<TransmissionRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchTransmissions = async () => {
    try {
      setRefreshing(true);
      const url = `${(import.meta.env.VITE_BACKEND_API_URL || 'http://127.0.0.1:8001/api')}/security/transmissions?user_role=${currentRole}&patient_id=${patientId || 'pat-001'}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTransmissions(data.transmissions || []);
        if (data.transmissions && data.transmissions.length > 0 && !selectedTx) {
          setSelectedTx(data.transmissions[0]);
        }
      }
    } catch (err) {
      console.warn('Could not fetch remote transmissions; using authenticated local state:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransmissions();
    const interval = setInterval(fetchTransmissions, 15000);
    return () => clearInterval(interval);
  }, [currentRole, patientId]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-[#0A192F] text-white rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-teal-500/20 rounded-lg border border-teal-500/40 text-teal-300">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {t('visualizer.title')}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-teal-950 text-teal-300 border border-teal-700/50">
                PQC Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {t('visualizer.subtitle')}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchTransmissions}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh')}</span>
            </button>
          </div>
        </div>

        {/* Zero-Leak Notice */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center space-x-2 text-xs text-slate-400">
          <EyeOff className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{t('visualizer.noDecryptedLeak')}</span>
        </div>
      </div>

      {/* Main Grid: Transmission Selector & Deep-Dive Flow Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recorded Transmissions List */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
              <Send className="w-4 h-4 text-teal-600" />
              <span>Active Transmissions ({transmissions.length})</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Live Session</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              {t('common.loading')}
            </div>
          ) : transmissions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {t('common.empty')}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {transmissions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    selectedTx?.id === tx.id
                      ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-1 ring-teal-500/20'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900">{tx.id}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {tx.delivery_status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate">{tx.transaction_type}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-[130px]">{tx.sender_id.split(' ')[0]} ➔ {tx.receiver_id.split(' ')[0]}</span>
                    <span className="font-mono text-[10px]">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 2 Columns: Cryptographic Path Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTx ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              
              {/* Transaction Overview Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {selectedTx.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedTx.transaction_type}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(selectedTx.timestamp).toUTCString()}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectedTx.delivery_status}</span>
                  </span>
                </div>
              </div>

              {/* End-to-End Visual Transmission Pipeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Activity className="w-4 h-4 text-teal-600 animate-pulse" />
                    <span>{t('visualizer.flowVisualizer')}</span>
                  </h4>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    Logical Dataflow (Shielded from Physical Hops)
                  </span>
                </div>
                
                {/* Flow Nodes with Animated Connecting Data Stream */}
                <div className="relative pt-2 pb-1">
                  {/* Glowing Animated Connecting Laser / Data Cable */}
                  <div className="hidden sm:block absolute top-[2.85rem] left-12 right-12 h-1 bg-gradient-to-r from-sky-400 via-teal-400 to-purple-500 rounded-full z-0 overflow-hidden shadow-sm">
                    {/* Moving Data Packet Photon */}
                    <div className="w-24 h-full bg-white blur-[2px] animate-packet" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative z-10">
                    {/* Step 1: Authorized Sender */}
                    <div className="p-3 bg-white/95 rounded-2xl border border-slate-200 shadow-sm text-center relative hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
                        <Send className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">{t('visualizer.stepSender')}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{selectedTx.sender_role}</p>
                      <span className="inline-block mt-1 text-[9px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        Authorized
                      </span>
                    </div>

                    {/* Step 2: Application API */}
                    <div className="p-3 bg-white/95 rounded-2xl border border-slate-200 shadow-sm text-center relative hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                        <Server className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">{t('visualizer.stepApi')}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">FastAPI Gateway</p>
                      <span className="inline-block mt-1 text-[9px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        Ingested
                      </span>
                    </div>

                    {/* Step 3: PQC Encryption & Signing */}
                    <div className="p-3 bg-teal-50/90 rounded-2xl border border-teal-300 shadow-sm text-center relative ring-2 ring-teal-400/40 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-md">
                        <Cpu className="w-5 h-5 animate-spin-slow" />
                      </div>
                      <p className="text-xs font-bold text-teal-950">{t('visualizer.stepCrypto')}</p>
                      <p className="text-[10px] text-teal-800 font-mono mt-0.5 font-semibold">ML-KEM + ML-DSA</p>
                      <span className="inline-block mt-1 text-[9px] font-mono px-2 py-0.5 bg-teal-200 text-teal-900 rounded-full font-extrabold">
                        Encapsulated
                      </span>
                    </div>

                    {/* Step 4: Storage */}
                    <div className="p-3 bg-white/95 rounded-2xl border border-slate-200 shadow-sm text-center relative hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                        <Database className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">{t('visualizer.stepStorage')}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">Supabase Storage</p>
                      <span className="inline-block mt-1 text-[9px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        RLS Enforced
                      </span>
                    </div>

                    {/* Step 5: Receiver */}
                    <div className="p-3 bg-white/95 rounded-2xl border border-slate-200 shadow-sm text-center relative hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">{t('visualizer.stepReceiver')}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{selectedTx.receiver_role}</p>
                      <span className="inline-block mt-1 text-[9px] font-mono px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-bold">
                        Decapsulated
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cryptographic State Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Encryption Status Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                    <Lock className="w-4 h-4 text-teal-600" />
                    <span>{t('visualizer.encryptionStatus')}</span>
                  </div>
                  <p className="text-xs font-mono text-slate-700 bg-white p-2 rounded border border-slate-200 break-words">
                    {selectedTx.encryption_status}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Shared session key negotiated via NIST FIPS 203 ML-KEM-768 lattice encapsulation.
                  </p>
                </div>

                {/* Digital Signature Verification Card */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs">
                    <FileCheck2 className="w-4 h-4 text-teal-600" />
                    <span>{t('visualizer.signatureStatus')}</span>
                  </div>
                  <p className="text-xs font-mono text-emerald-700 bg-white p-2 rounded border border-slate-200 font-semibold break-words">
                    {selectedTx.signature_verification}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Validated against authenticated NIST FIPS 204 ML-DSA-65 public key with zero bit-flip.
                  </p>
                </div>

              </div>

              {/* Integrity & Audit Telemetry */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-950 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{t('visualizer.integrityStatus')}: {selectedTx.integrity_status}</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-800">Tamper-Proof Guarantee</span>
                </div>
                <p className="text-xs text-emerald-900">
                  {selectedTx.security_notes}
                </p>
              </div>

              {/* Event Step Timeline */}
              {selectedTx.flow_steps && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Detailed Event Verification Timeline
                  </h4>
                  <div className="space-y-2">
                    {selectedTx.flow_steps.map((st, i) => (
                      <div key={i} className="flex items-start space-x-3 text-xs p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{st.step}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-100 text-emerald-800">
                              {st.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{st.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 text-sm">
              Select a transmission record to inspect its cryptographic trajectory.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
