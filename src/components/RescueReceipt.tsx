import React, { useState } from 'react';
import { RescueReceipt } from '../types';
import { CheckCircle2, Copy, Download } from 'lucide-react';

interface RescueReceiptCardProps {
  receipt: RescueReceipt;
  onDismiss?: () => void;
}

export const RescueReceiptCard: React.FC<RescueReceiptCardProps> = ({ receipt, onDismiss }) => {
  const [copied, setCopied] = useState(false);

  const receiptText = [
    '═══════════════════════════════════',
    '   WOBBLE — RESCUE RECEIPT',
    '═══════════════════════════════════',
    '',
    `Issued: ${new Date(receipt.createdAt).toLocaleString()}`,
    `Operation: ${receipt.planTitle}`,
    '',
    receipt.headline,
    '',
    receipt.verdict,
    '',
    '── Proof of Action ──',
    ...receipt.proofPoints.map((p) => `• ${p}`),
    '',
    `Risk shift: ${receipt.riskReduction}`,
    `Deliverables generated: ${receipt.deliverableCount}`,
    `Tasks injected to queue: ${receipt.tasksInjected}`,
    '',
    'Original panic dump:',
    `"${receipt.panicText}"`,
    '',
    'STATUS: RESCUE PROTOCOL EXECUTED',
    '═══════════════════════════════════',
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rescue-receipt-${receipt.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-[#2D4A3E] text-white rounded-3xl p-6 md:p-8 shadow-lg animate-fadeIn border border-[#233A30]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#BF6B4E]">
            Rescue Receipt Issued
          </span>
          <h3 className="text-xl md:text-2xl font-serif italic mt-1">{receipt.headline}</h3>
        </div>
        <CheckCircle2 className="w-8 h-8 text-[#BF6B4E] shrink-0" />
      </div>

      <p className="text-sm font-serif italic text-white/90 leading-relaxed mb-4">{receipt.verdict}</p>

      <ul className="flex flex-col gap-2 mb-6">
        {receipt.proofPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-xs font-mono text-white/80">
            <span className="text-[#BF6B4E]">✓</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider text-white/50 mb-6">
        <span className="bg-white/10 px-2 py-1 rounded">{receipt.riskReduction}</span>
        <span className="bg-white/10 px-2 py-1 rounded">{receipt.deliverableCount} deliverables</span>
        <span className="bg-white/10 px-2 py-1 rounded">{receipt.tasksInjected} tasks queued</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors"
        >
          {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied' : 'Copy Receipt'}</span>
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-2 bg-[#BF6B4E] hover:bg-[#A8583B] px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-mono text-white/50 hover:text-white uppercase tracking-wider px-2"
          >
            Dismiss
          </button>
        )}
      </div>
    </section>
  );
};

const RECEIPTS_STORAGE_KEY = 'deadline_rescue_receipts';

export function saveRescueReceipt(receipt: RescueReceipt): void {
  try {
    const existing = JSON.parse(localStorage.getItem(RECEIPTS_STORAGE_KEY) || '[]') as RescueReceipt[];
    localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify([receipt, ...existing].slice(0, 20)));
  } catch {
    // ignore
  }
}

export function loadRescueReceipts(): RescueReceipt[] {
  try {
    return JSON.parse(localStorage.getItem(RECEIPTS_STORAGE_KEY) || '[]') as RescueReceipt[];
  } catch {
    return [];
  }
}

export function buildRescueReceipt(
  panicText: string,
  planTitle: string,
  riskReduction: string,
  receiptPreview: { headline: string; verdict: string; proofPoints: string[] } | undefined,
  deliverableCount: number,
  tasksInjected: number
): RescueReceipt {
  return {
    id: `receipt_${Date.now()}`,
    createdAt: Date.now(),
    panicText,
    planTitle,
    headline: receiptPreview?.headline || 'Deadline Collision Averted',
    verdict: receiptPreview?.verdict || 'Rescue protocol executed. Minimum viable actions queued.',
    proofPoints: receiptPreview?.proofPoints || [
      'Cascade failure mapped',
      'Survival schedule generated',
      'Tasks injected to execution queue',
    ],
    riskReduction,
    deliverableCount,
    tasksInjected,
  };
}
