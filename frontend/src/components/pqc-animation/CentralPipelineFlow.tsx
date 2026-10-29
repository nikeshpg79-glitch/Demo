import React from 'react';
import { 
  Building2, 
  Cpu, 
  ShieldCheck, 
  Lock, 
  User, 
  CheckCircle2, 
  Activity,
  ArrowRight,
  Radio,
  KeyRound
} from 'lucide-react';

interface CentralPipelineFlowProps {
  currentStage: number; // 1 to 7 for sender, or 1 to 6 for receiver
  mode: 'encryption' | 'decryption';
  isTampered?: boolean;
}

export const CentralPipelineFlow: React.FC<CentralPipelineFlowProps> = ({
  currentStage,
  mode,
  isTampered = false
}) => {
  // Define 5 key architectural nodes in the hospital ⇄ patient flow
  const nodes = [
    {
      id: 1,
      title: 'Sender Station',
      subtitle: 'Doctor / Lab Server',
      icon: Building2,
      activeOnSender: [1, 2],
      activeOnReceiver: []
    },
    {
      id: 2,
      title: 'Post-Quantum Engine',
      subtitle: 'ML-KEM-768 & AES-GCM',
      icon: Cpu,
      activeOnSender: [3, 4, 5],
      activeOnReceiver: []
    },
    {
      id: 3,
      title: 'Lattice Channel',
      subtitle: 'Encrypted Quantum TLS',
      icon: Lock,
      activeOnSender: [6],
      activeOnReceiver: [1]
    },
    {
      id: 4,
      title: 'Decapsulation Node',
      subtitle: 'Poly1305 & ML-DSA Verify',
      icon: KeyRound,
      activeOnSender: [],
      activeOnReceiver: [2, 3, 4, 5]
    },
    {
      id: 5,
      title: 'Patient Inbox',
      subtitle: 'Confidential Plaintext',
      icon: User,
      activeOnSender: [7],
      activeOnReceiver: [6]
    }
  ];

  const isNodeActive = (node: typeof nodes[0]) => {
    if (mode === 'encryption') {
      return node.activeOnSender.includes(currentStage);
    } else {
      return node.activeOnReceiver.includes(currentStage);
    }
  };

  const isNodePast = (node: typeof nodes[0]) => {
    if (mode === 'encryption') {
      return Math.max(...(node.activeOnSender.length ? node.activeOnSender : [0])) < currentStage;
    } else {
      return Math.max(...(node.activeOnReceiver.length ? node.activeOnReceiver : [0])) < currentStage;
    }
  };

  return (
    <div className="w-full bg-[#070F1E]/90 border border-cyan-500/20 rounded-2xl p-4 sm:p-5 text-white shadow-xl backdrop-blur-md">
      
      {/* Top Banner Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isTampered ? 'bg-rose-400' : 'bg-teal-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isTampered ? 'bg-rose-500' : 'bg-teal-500'
            }`} />
          </span>
          <span className="font-mono text-cyan-300 font-semibold uppercase tracking-wider">
            {mode === 'encryption' ? 'Post-Quantum Encryption Pipeline' : 'Post-Quantum Decryption & Verification'}
          </span>
        </div>
        
        <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700/80 text-teal-300">
            NIST FIPS 203 (ML-KEM)
          </span>
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700/80 text-cyan-300">
            AES-256-GCM
          </span>
          <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700/80 text-violet-300">
            NIST FIPS 204 (ML-DSA)
          </span>
        </div>
      </div>

      {/* Horizontal Pipeline Steps */}
      <div className="relative">
        
        {/* Animated Connecting Track */}
        <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1 -translate-y-1/2 bg-slate-800 rounded-full z-0 overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 rounded-full ${
              isTampered 
                ? 'bg-rose-500' 
                : 'bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400'
            }`}
            style={{
              width: `${Math.min(100, (currentStage / (mode === 'encryption' ? 7 : 6)) * 100)}%`
            }}
          />
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-2 relative z-10">
          {nodes.map((node, index) => {
            const active = isNodeActive(node);
            const past = isNodePast(node);
            const Icon = node.icon;

            return (
              <div 
                key={node.id} 
                className={`flex flex-row md:flex-col items-center md:text-center p-3 rounded-xl transition-all duration-300 ${
                  active 
                    ? isTampered 
                      ? 'bg-rose-950/60 border border-rose-500/60 shadow-lg shadow-rose-900/30'
                      : 'bg-cyan-950/50 border border-cyan-400/60 shadow-lg shadow-cyan-950/50 scale-[1.02]' 
                    : past 
                    ? 'bg-slate-900/50 border border-teal-500/30 text-slate-300' 
                    : 'bg-slate-900/30 border border-slate-800/80 text-slate-500'
                }`}
              >
                {/* Node Icon Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-3 md:mr-0 md:mb-2 transition-transform ${
                  active 
                    ? isTampered 
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 shadow-md shadow-cyan-500/20' 
                    : past 
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {past ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Node Text */}
                <div className="flex-1 md:w-full">
                  <div className="flex items-center md:justify-center space-x-1.5">
                    <span className={`text-xs font-bold leading-tight ${
                      active ? 'text-white' : past ? 'text-teal-200' : 'text-slate-400'
                    }`}>
                      {node.title}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                    {node.subtitle}
                  </p>
                </div>

                {/* Status Indicator Pill */}
                <div className="ml-auto md:ml-0 md:mt-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    active 
                      ? isTampered
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 animate-pulse'
                      : past 
                      ? 'bg-teal-500/10 text-teal-300' 
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    {active ? 'ACTIVE' : past ? 'PASSED' : 'WAITING'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

