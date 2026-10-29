import React from 'react';
import { 
  Check, 
  Clock, 
  AlertCircle, 
  Cpu, 
  Key, 
  Lock, 
  Send, 
  CheckCircle2, 
  FileText, 
  Binary, 
  FileSignature 
} from 'lucide-react';

export interface TimelineStepItem {
  id: number;
  name: string;
  shortDescription: string;
  technicalDescription?: string;
  standard?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'not_configured';
  timestamp?: string;
  icon?: any;
}

export interface EncryptionStepTimelineProps {
  steps: TimelineStepItem[];
  currentStepId: number;
  onStepClick?: (stepId: number) => void;
}

export const EncryptionStepTimeline: React.FC<EncryptionStepTimelineProps> = ({
  steps,
  currentStepId,
  onStepClick
}) => {
  return (
    <div className="space-y-3" role="list" aria-label="Cryptographic Workflow Steps">
      {steps.map((step) => {
        const isCurrent = step.id === currentStepId;
        const isCompleted = step.status === 'completed';
        const isFailed = step.status === 'failed';
        const isInProgress = step.status === 'in_progress';

        return (
          <div
            key={step.id}
            onClick={() => onStepClick && onStepClick(step.id)}
            role="listitem"
            className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
              isCompleted
                ? 'bg-slate-900/60 border-teal-500/40 text-slate-200'
                : isInProgress
                ? 'bg-cyan-950/50 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 scale-[1.01]'
                : isFailed
                ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                : 'bg-slate-900/30 border-slate-800/80 text-slate-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                  isCompleted
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                    : isInProgress
                    ? 'bg-cyan-400 text-slate-950 font-black animate-pulse'
                    : isFailed
                    ? 'bg-rose-500 text-white font-black'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.id}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">
                      Step {step.id} — {step.name}
                    </h4>
                    {step.standard && (
                      <span className="text-[10px] font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded text-teal-300">
                        {step.standard}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {step.shortDescription}
                  </p>
                </div>
              </div>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                isCompleted
                  ? 'bg-teal-500/20 text-teal-300 font-bold'
                  : isInProgress
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold animate-pulse'
                  : isFailed
                  ? 'bg-rose-500/20 text-rose-300 font-bold'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                {step.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {step.technicalDescription && (isCurrent || isCompleted) && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
                <span className="text-teal-400">Technical Note: </span>
                <span>{step.technicalDescription}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

