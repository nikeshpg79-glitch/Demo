import React from 'react';
import { ShieldAlert, ArrowLeft, LogOut, Lock, UserCheck, Shield } from 'lucide-react';
import { UserRole } from '../types';

interface AccessDeniedViewProps {
  currentRole: UserRole | null;
  requiredRole: string;
  onNavigateHome: () => void;
  onSignOut: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  currentRole,
  requiredRole,
  onNavigateHome,
  onSignOut
}) => {
  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#0A192F] text-white rounded-3xl p-6 sm:p-8 border border-rose-500/40 shadow-2xl relative overflow-hidden text-center space-y-6">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center shadow-lg shadow-rose-950/40">
          <ShieldAlert className="w-9 h-9 text-rose-400 animate-pulse" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
            403 Forbidden — Zero-Trust Access Violation
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            Access Restricted to {requiredRole.toUpperCase()}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            Your authenticated identity possesses clearance for the{' '}
            <strong className="text-teal-300 uppercase font-mono">{currentRole || 'GUEST'}</strong> role. 
            Access to this portal is restricted by PostgreSQL Row-Level Security (RLS) policies.
          </p>
        </div>

        {/* Defense Policy Box */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-left text-xs font-mono space-y-1.5 text-slate-400">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Security Enforcement:</span>
            </span>
            <span className="text-rose-400 font-bold">NON-ELEVATABLE</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Users cannot switch roles without authenticating with verified credentials and valid cryptographic staff tokens.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to My Portal</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out &amp; Switch Portal</span>
          </button>
        </div>

      </div>
    </div>
  );
};

