import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Layers, 
  ArrowRight, 
  Key, 
  Stethoscope, 
  FlaskConical, 
  UserCheck, 
  FileCheck2,
  AlertTriangle,
  Zap,
  Building2,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { UserRole } from '../types';
import { DoctorPatientIllustration, QuantumShieldIllustration } from './illustrations/MedicalIllustrations';

interface LandingPageProps {
  onOpenPortalAuth: (portal: UserRole) => void;
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenPortalAuth, onNavigate }) => {
  return (
    <div className="space-y-14 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#070F1E] via-[#0A192F] to-[#160B2E] text-white p-6 md:p-14 shadow-2xl border border-cyan-500/20">
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-[30rem] h-[30rem] rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-float" />
        <div className="absolute bottom-0 left-1/4 -mb-24 w-[28rem] h-[28rem] rounded-full bg-violet-500/15 blur-3xl pointer-events-none animate-float-reverse" />
        <div className="absolute top-1/2 left-0 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Quantum-Resistant <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-violet-300">
                Hospital-to-Laboratory
              </span> <br />
              Data Exchange
            </h1>

            <p className="text-base md:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
              Safeguarding lifelong patient medical records against the existential <strong>"Store Now, Decrypt Later" (SNDL)</strong> quantum threat using NIST-standardized Post-Quantum Lattice Cryptography (<strong>ML-KEM-768</strong> &amp; <strong>ML-DSA-65</strong>) with <strong>QpiAI Quantum SDK</strong> entropy.
            </p>

            <div className="flex flex-wrap gap-3.5 pt-2">
              <button
                onClick={() => onOpenPortalAuth('patient')}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:opacity-95 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2 cursor-pointer"
              >
                <span>Launch Patient Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('security')}
                className="px-5 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-cyan-200 font-semibold text-sm border border-cyan-500/30 transition-all flex items-center space-x-2 cursor-pointer backdrop-blur-sm"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Quantum Threat Console</span>
              </button>

              <button
                onClick={() => onNavigate('visualizer')}
                className="px-5 py-3.5 rounded-2xl bg-violet-950/50 hover:bg-violet-900/60 text-violet-200 font-semibold text-sm border border-violet-500/40 transition-all flex items-center space-x-2 cursor-pointer backdrop-blur-sm"
              >
                <Activity className="w-4 h-4 text-violet-300" />
                <span>Network Laser Monitor</span>
              </button>
            </div>
          </div>

          {/* Hero Right Visuals */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md p-4 rounded-3xl bg-slate-950/60 border border-cyan-500/30 backdrop-blur-md shadow-2xl relative">
              <DoctorPatientIllustration className="w-full h-auto drop-shadow-[0_0_30px_rgba(56,189,248,0.25)]" />
              <div className="mt-2 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center space-x-2 text-cyan-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Quantum Shield: Armed</span>
                </div>
                <span className="text-slate-400">ML-KEM-768 • ML-DSA-65</span>
              </div>
            </div>
          </div>

        </div>

        {/* Floating Quick Badges */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Key Encapsulation</p>
              <p className="text-sm font-bold text-white font-mono">ML-KEM-768</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Digital Signature</p>
              <p className="text-sm font-bold text-white font-mono">ML-DSA-65</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Symmetric Cipher</p>
              <p className="text-sm font-bold text-white font-mono">AES-256-GCM</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Quantum SDK</p>
              <p className="text-sm font-bold text-white font-mono">QpiAI v0.7.5</p>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Portals */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-semibold">
            <span>Zero-Trust Role-Based Access Control</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#0A192F]">Three Specialized Healthcare Workspaces</h2>
          <p className="text-slate-600 text-sm">
            Enforced through strict PostgreSQL Row-Level Security (RLS) policies. Each role receives cryptographically isolated access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Patient Card */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 hover:border-cyan-400 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-50 text-cyan-700 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
                <UserCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#0A192F] group-hover:text-cyan-700 transition-colors">1. Patient Portal</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Browse certified physicians, schedule clinical appointments, view diagnostic orders, 
                and decrypt confidential reports with your private quantum key.
              </p>
              <ul className="text-xs text-slate-500 space-y-2.5 pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Searchable doctor catalog &amp; slot booking</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Personal encrypted report decapsulation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>Upload &amp; inspect private medical images</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenPortalAuth('patient')}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-[#0A192F] to-[#0E345A] hover:opacity-95 text-cyan-300 font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Enter Patient Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Doctor Card */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 hover:border-blue-400 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 text-blue-700 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#0A192F] group-hover:text-blue-700 transition-colors">2. Doctor Dashboard</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Manage assigned patients, review clinical histories, author precise lab test orders, 
                and receive cryptographically verified diagnostic results.
              </p>
              <ul className="text-xs text-slate-500 space-y-2.5 pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Authorized patient appointment queue</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Lab order dispatch with clinical specs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Attach prescriptions &amp; medical scans</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenPortalAuth('doctor')}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-[#0A192F] to-[#0E345A] hover:opacity-95 text-blue-300 font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Enter Doctor Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Lab Technician Card */}
          <div className="bg-white rounded-3xl p-7 border border-slate-200/80 hover:border-teal-400 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-50 text-teal-700 flex items-center justify-center font-bold shadow-inner group-hover:scale-105 transition-transform">
                <FlaskConical className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#0A192F] group-hover:text-teal-700 transition-colors">3. Laboratory Assistant</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Process specimen queues, enter clinical biomarkers, trigger quantum key encapsulation 
                (ML-KEM), and sign reports with lattice digital signatures (ML-DSA).
              </p>
              <ul className="text-xs text-slate-500 space-y-2.5 pt-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Automated PQC envelope generation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>ML-DSA tamper-proof signature binding</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Secure diagnostic image uploads</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => onOpenPortalAuth('lab_technician')}
              className="mt-6 w-full py-3 rounded-2xl bg-gradient-to-r from-[#0A192F] to-[#0E345A] hover:opacity-95 text-teal-300 font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Enter Lab Station</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* End-to-End Cryptographic Architecture */}
      <section className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200/80 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-2">
              <span>Logical Data Pipeline</span>
            </div>
            <h3 className="text-2xl font-bold text-[#0A192F]">Cryptographic Flow: Hospital ⇄ Lab</h3>
            <p className="text-slate-600 text-sm">
              How post-quantum lattice cryptography protects medical data throughout transit and storage.
            </p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-95 text-white font-bold text-xs transition-all shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <span>Inspect Live Report Envelopes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-cyan-300 transition-colors">
            <span className="text-[11px] font-mono font-bold text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">STEP 01</span>
            <h4 className="font-bold text-slate-800 text-sm">Doctor Orders Lab Test</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Doctor creates requisition with clinical questions. Patient and doctor ML-KEM-768 public keys are registered.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-teal-300 transition-colors">
            <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded">STEP 02</span>
            <h4 className="font-bold text-slate-800 text-sm">Lab Analyzes &amp; Encapsulates</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lab generates 256-bit symmetric key, encapsulating it via ML-KEM-768 for both the doctor and patient.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-indigo-300 transition-colors">
            <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">STEP 03</span>
            <h4 className="font-bold text-slate-800 text-sm">AES-256-GCM + ML-DSA Sign</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Biomarkers are encrypted with AES-256-GCM. The lab technician signs the ciphertext with ML-DSA-65.
            </p>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-violet-300 transition-colors">
            <span className="text-[11px] font-mono font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded">STEP 04</span>
            <h4 className="font-bold text-slate-800 text-sm">Zero-Trust Decapsulation</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Only the authorized doctor and patient can decapsulate the shared secret and verify the non-repudiable signature.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};
