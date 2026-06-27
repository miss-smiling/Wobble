import React from 'react';
import { AlertTriangle } from 'lucide-react';

type RiskTier = 'low' | 'medium' | 'high' | 'critical';

interface RiskFlowChartProps {
  riskScore: number;
}

const TIERS: { id: RiskTier; label: string; color: string; bg: string; min: number }[] = [
  { id: 'critical', label: 'Critical', color: '#BF6B4E', bg: 'bg-[#BF6B4E]/15', min: 75 },
  { id: 'high', label: 'High', color: '#D9822B', bg: 'bg-[#D9822B]/15', min: 50 },
  { id: 'medium', label: 'Medium', color: '#2D4A3E', bg: 'bg-[#2D4A3E]/10', min: 25 },
  { id: 'low', label: 'Low', color: '#2D4A3E', bg: 'bg-[#2D4A3E]/5', min: 0 },
];

function getActiveTier(score: number): RiskTier {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

export const RiskFlowChart: React.FC<RiskFlowChartProps> = ({ riskScore }) => {
  const active = getActiveTier(riskScore);
  const activeMeta = TIERS.find((t) => t.id === active)!;

  return (
    <section className="bg-[#F7F2EB] border border-[#E5E0D8] rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden h-full">
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#BF6B4E] font-mono flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          Risk Flow
        </span>
        <div
          className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${activeMeta.bg}`}
          style={{ color: activeMeta.color }}
        >
          {activeMeta.label}
        </div>
      </div>

      <div className="flex gap-4 flex-1 items-stretch py-2">
        <div className="flex flex-col justify-between text-[9px] font-mono uppercase tracking-wider text-[#1F1F1F]/40 py-1 shrink-0">
          <span>Critical</span>
          <span>High</span>
          <span>Medium</span>
          <span>Low</span>
        </div>

        <div className="relative flex-1 flex flex-col justify-between py-1">
          <div className="absolute left-4 top-3 bottom-3 w-px bg-[#E5E0D8]" />

          {TIERS.map((tier) => {
            const isActive = tier.id === active;
            return (
              <div key={tier.id} className="relative flex items-center gap-3 z-10">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isActive ? 'scale-110 shadow-md' : 'opacity-50'
                  }`}
                  style={{
                    borderColor: tier.color,
                    backgroundColor: isActive ? tier.color : 'white',
                  }}
                >
                  {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div
                  className={`flex-1 rounded-xl px-3 py-2 border transition-all duration-500 ${
                    isActive ? `${tier.bg} border-[#E5E0D8] shadow-sm` : 'border-transparent opacity-40'
                  }`}
                >
                  <p
                    className="text-xs font-mono font-bold uppercase tracking-wider"
                    style={{ color: isActive ? tier.color : '#1F1F1F' }}
                  >
                    {tier.label}
                  </p>
                  {isActive && (
                    <p className="text-[10px] text-[#1F1F1F]/60 font-serif italic mt-0.5">
                      {tier.id === 'critical' && 'Immediate rescue required'}
                      {tier.id === 'high' && 'Deadlines converging fast'}
                      {tier.id === 'medium' && 'Watch for cascade risk'}
                      {tier.id === 'low' && 'Stable for now'}
                    </p>
                  )}
                </div>
                {tier.id !== 'low' && (
                  <div className="absolute left-[2.15rem] -bottom-3 text-[#BF6B4E]/40 text-xs pointer-events-none">↓</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[10px] font-mono text-[#1F1F1F]/50 mt-4 text-center uppercase tracking-wider">
        {pendingLabel(riskScore)}
      </p>
    </section>
  );
};

function pendingLabel(score: number): string {
  if (score >= 75) return 'Escalation path: Critical zone';
  if (score >= 50) return 'Trending toward high risk';
  if (score >= 25) return 'Monitor — medium exposure';
  return 'Flow stable — low risk';
}
