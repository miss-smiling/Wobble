import React from 'react';
import { CascadeAnalysis } from '../types';
import { AlertTriangle, ChevronDown } from 'lucide-react';

interface CascadeSimulatorProps {
  cascade: CascadeAnalysis;
  compact?: boolean;
}

const severityStyles = {
  critical: { border: 'border-[#BF6B4E]', bg: 'bg-[#BF6B4E]/10', text: 'text-[#BF6B4E]' },
  high: { border: 'border-[#D9822B]', bg: 'bg-[#D9822B]/10', text: 'text-[#D9822B]' },
  medium: { border: 'border-[#2D4A3E]/40', bg: 'bg-[#2D4A3E]/5', text: 'text-[#2D4A3E]' },
};

export const CascadeSimulator: React.FC<CascadeSimulatorProps> = ({ cascade, compact }) => {
  return (
    <section className={`bg-white border border-[#E5E0D8] rounded-2xl shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#BF6B4E] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Domino Cascade Simulator
          </span>
          <p className="text-sm font-serif italic text-[#1F1F1F] mt-1">{cascade.collisionSummary}</p>
        </div>
        {cascade.hoursUntilCollision > 0 && (
          <span className="text-[10px] font-mono uppercase tracking-wider bg-[#BF6B4E]/10 text-[#BF6B4E] px-3 py-1.5 rounded-full shrink-0">
            Collision in ~{cascade.hoursUntilCollision}h
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0">
        {cascade.dominoes.map((domino, i) => {
          const style = severityStyles[domino.severity] || severityStyles.medium;
          const isLast = i === cascade.dominoes.length - 1;

          return (
            <div key={domino.step} className="flex flex-col items-center">
              <div className={`w-full border rounded-2xl p-4 ${style.border} ${style.bg}`}>
                <div className="flex items-start gap-3">
                  <span className={`text-xs font-mono font-bold ${style.text} shrink-0`}>
                    {String(domino.step).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-mono uppercase tracking-wider text-[#1F1F1F]/50 mb-0.5">If ignored</p>
                    <p className="text-sm font-medium text-[#1F1F1F]">{domino.trigger}</p>
                    <p className="text-xs font-mono uppercase tracking-wider text-[#1F1F1F]/50 mt-2 mb-0.5">Then</p>
                    <p className={`text-sm font-serif italic ${style.text}`}>{domino.consequence}</p>
                  </div>
                </div>
              </div>
              {!isLast && (
                <ChevronDown className="w-5 h-5 text-[#BF6B4E]/50 my-1 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
