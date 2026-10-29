import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck, 
  Key, 
  AlertCircle, 
  CheckCircle, 
  Stethoscope,
  FlaskConical,
  UserCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  initialPortal?: UserRole;
  onSuccessRedirect?: (role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin',
  initialPortal = 'patient',
  onSuccessRedirect
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [selectedPortal, setSelectedPortal] = useState<UserRole>(initialPortal);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [staffInviteCode, setStaffInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  useEffect(() => {
    if (initialPortal) {
      setSelectedPortal(initialPortal);
      // Auto-populate demo email for ease of evaluation
      const demo = DEMO_ACCOUNTS[initialPortal];
      if (demo) {
        setEmail(demo.email);
        setPassword(demo.password);
      }
    }
  }, [initialPortal, isOpen]);

  if (!isOpen) return null;

  const handlePortalChange = (portal: UserRole) => {
    setSelectedPortal(portal);
    setErrorMessage(null);
    setSuccessMessage(null);
    const demo = DEMO_ACCOUNTS[portal];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
      setFullName(demo.name);
    }
    if (portal === 'doctor') {
      setStaffInviteCode('HOSPITAL-DOC-2026');
    } else if (portal === 'lab_technician') {
      setStaffInviteCode('LAB-ASSIST-2026');
    } else if (portal === 'admin') {
      setStaffInviteCode('HOSPITAL-ADMIN-2026');
    } else {
      setStaffInviteCode('');
    }
  };

  const handleQuickDemoFill = (portal: UserRole) => {
    handlePortalChange(portal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    if (mode === 'signin') {
      const res = await signIn(email, password, selectedPortal);
      setSubmitting(false);
      if (res.success) {
        if (onSuccessRedirect) {
          onSuccessRedirect(selectedPortal);
        }
        onClose();
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } else {
      const res = await signUp(email, password, fullName, selectedPortal, staffInviteCode);
      setSubmitting(false);
      if (res.success) {
        setSuccessMessage(res.message || 'Account successfully registered!');
        setTimeout(() => {
          if (onSuccessRedirect) {
            onSuccessRedirect(selectedPortal);
          }
          onClose();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to complete registration.');
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col md:flex-row my-auto max-h-[95vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close authentication dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Visual Column: Portal Cybersecurity Seal & Role Identity */}
        <div className="md:w-5/12 bg-gradient-to-br from-[#070F1E] via-[#0A192F] to-[#121B35] p-6 sm:p-8 text-white relative flex flex-col justify-between overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-4 right-6 w-36 h-36 rounded-full bg-cyan-400/15 blur-2xl pointer-events-none" />
          <div className="absolute bottom-6 left-4 w-40 h-40 rounded-full bg-violet-500/15 blur-2xl pointer-events-none" />

          {/* Header Info */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-teal-300 font-bold">
                Zero-Trust Healthcare Auth
              </span>
            </div>

            <h2 id="auth-modal-title" className="text-2xl font-extrabold tracking-tight text-white leading-tight">
              PQC HealthSecure
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Three cryptographically isolated portals protected by Post-Quantum lattice security.
            </p>
          </div>

          {/* Active Portal Badge */}
          <div className="my-6 relative z-10 bg-slate-900/90 p-4 rounded-2xl border border-teal-500/30 space-y-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-md">
                {selectedPortal === 'doctor' && <Stethoscope className="w-5 h-5 text-slate-950" />}
                {selectedPortal === 'lab_technician' && <FlaskConical className="w-5 h-5 text-slate-950" />}
                {selectedPortal === 'patient' && <UserCheck className="w-5 h-5 text-slate-950" />}
                {selectedPortal === 'admin' && <ShieldAlert className="w-5 h-5 text-slate-950" />}
              </div>
              <div>
                <span className="text-[10px] text-teal-400 font-mono uppercase font-bold block">
                  Active Access Portal
                </span>
                <span className="text-sm font-bold text-white block">
                  {selectedPortal === 'doctor' && 'Doctor Medical Staff Portal'}
                  {selectedPortal === 'lab_technician' && 'Laboratory Technician Portal'}
                  {selectedPortal === 'patient' && 'Patient Confidential Portal'}
                  {selectedPortal === 'admin' && 'Security Administration Console'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Encryption standard:</span>
                <span className="text-teal-300">ML-KEM-768</span>
              </div>
              <div className="flex justify-between">
                <span>Digital signatures:</span>
                <span className="text-cyan-300">ML-DSA-65</span>
              </div>
              <div className="flex justify-between">
                <span>Access defense:</span>
                <span className="text-emerald-400">PostgreSQL RLS Isolated</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="relative z-10 text-[11px] text-slate-400">
            Role switching inside dashboards is disabled to prevent privilege escalation.
          </div>
        </div>

        {/* Right Interactive Column: Portal Tabs, Demo Buttons & Form */}
        <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          
          <div>
            {/* 1. Portal Selection Tabs */}
            <div className="space-y-1.5 mb-5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Select Healthcare Workspace Portal:
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handlePortalChange('patient')}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center space-y-0.5 cursor-pointer ${
                    selectedPortal === 'patient'
                      ? 'bg-[#0A192F] text-teal-300 shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="text-[11px]">Patient</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePortalChange('doctor')}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center space-y-0.5 cursor-pointer ${
                    selectedPortal === 'doctor'
                      ? 'bg-[#0A192F] text-sky-300 shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span className="text-[11px]">Doctor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePortalChange('lab_technician')}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center space-y-0.5 cursor-pointer ${
                    selectedPortal === 'lab_technician'
                      ? 'bg-[#0A192F] text-purple-300 shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FlaskConical className="w-4 h-4" />
                  <span className="text-[11px]">Lab Tech</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePortalChange('admin')}
                  className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex flex-col items-center space-y-0.5 cursor-pointer ${
                    selectedPortal === 'admin'
                      ? 'bg-[#0A192F] text-rose-300 shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span className="text-[11px]">Admin</span>
                </button>
              </div>
            </div>

            {/* Quick Demo Fill One-Click Pill */}
            <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 font-medium truncate">
                Demo Account: <strong className="text-slate-800">{DEMO_ACCOUNTS[selectedPortal]?.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleQuickDemoFill(selectedPortal)}
                className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shrink-0 transition-all cursor-pointer shadow-sm"
              >
                1-Click Load
              </button>
            </div>

            {/* Mode Switch (Sign In vs Sign Up) */}
            <div className="flex border-b border-slate-200 mb-5 text-sm font-semibold">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMessage(null); }}
                className={`pb-2.5 px-4 cursor-pointer transition-all ${
                  mode === 'signin'
                    ? 'border-b-2 border-teal-600 text-teal-700 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In to {selectedPortal === 'doctor' ? 'Doctor' : selectedPortal === 'lab_technician' ? 'Lab' : selectedPortal === 'admin' ? 'Admin' : 'Patient'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMessage(null); }}
                className={`pb-2.5 px-4 cursor-pointer transition-all ${
                  mode === 'signup'
                    ? 'border-b-2 border-teal-600 text-teal-700 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Register Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              {/* Full Name (Sign Up only) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Dr. Vikramaditya Sen"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    placeholder="name@pqc.health"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Staff Invite Code (Sign Up for privileged roles) */}
              {mode === 'signup' && selectedPortal !== 'patient' && (
                <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center space-x-1.5 text-teal-900 font-bold">
                    <Key className="w-3.5 h-3.5 text-teal-600" />
                    <span>Staff Verification Invite Code</span>
                  </div>
                  <p className="text-[11px] text-teal-800 leading-tight">
                    Demo Token: <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-slate-900">
                      {selectedPortal === 'doctor' ? 'HOSPITAL-DOC-2026' : selectedPortal === 'lab_technician' ? 'LAB-ASSIST-2026' : 'HOSPITAL-ADMIN-2026'}
                    </code>
                  </p>
                  <input
                    type="text"
                    value={staffInviteCode}
                    onChange={(e) => setStaffInviteCode(e.target.value)}
                    placeholder="Enter staff verification code"
                    className="w-full mt-1 px-3 py-1.5 rounded-lg border border-teal-300 text-xs bg-white text-slate-900 outline-none focus:border-teal-500 font-mono"
                    required
                  />
                </div>
              )}

              {/* Alerts */}
              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400 hover:opacity-95 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all cursor-pointer disabled:opacity-50 mt-1"
              >
                {submitting
                  ? 'Verifying Cryptographic Credentials...'
                  : mode === 'signin'
                  ? `Enter ${selectedPortal === 'doctor' ? 'Doctor' : selectedPortal === 'lab_technician' ? 'Laboratory' : selectedPortal === 'admin' ? 'Admin' : 'Patient'} Portal`
                  : `Enroll as Certified ${selectedPortal.toUpperCase()}`
                }
              </button>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
