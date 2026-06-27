import React, { useState } from 'react';
import { AgenticDeliverable } from '../types';
import { Copy, Check, FileText } from 'lucide-react';

interface DeliverablesPanelProps {
  deliverables: AgenticDeliverable[];
}

export const DeliverablesPanel: React.FC<DeliverablesPanelProps> = ({ deliverables }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!deliverables.length) return null;

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <section className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2D4A3E] mb-1 flex items-center gap-1.5">
        <FileText className="w-4 h-4 text-[#BF6B4E]" />
        Agentic Deliverables — Ready to Send
      </h3>
      <p className="text-[11px] text-[#1F1F1F]/50 font-mono mb-4">
        AI-generated drafts you can copy and use immediately. No more blank-page panic.
      </p>

      <div className="flex flex-col gap-4">
        {deliverables.map((item, i) => (
          <div key={i} className="border border-[#E5E0D8] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 bg-[#F7F2EB] px-4 py-2.5 border-b border-[#E5E0D8]">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2D4A3E]">
                {item.label}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(item.content, i)}
                className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#BF6B4E] hover:text-[#A8583B] transition-colors"
              >
                {copiedIndex === i ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-[#1F1F1F]/80 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-[#FDFBF7]">
              {item.content}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
};
