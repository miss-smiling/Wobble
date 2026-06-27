import React, { useState, useCallback } from 'react';
import { RescuePlan, Task, RescueReceipt } from '../types';
import { ShieldAlert, Sparkles, ArrowRight, CheckCircle2, Zap, ArrowLeft, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getUserUsage,
  isRescueLimitReached,
  incrementRescueUsage,
} from '../services/userUsage';
import { getCachedPlan, saveCachedPlan } from '../services/planCache';
import { useSpeechInput } from '../hooks/useSpeechInput';
import { CascadeSimulator } from './CascadeSimulator';
import { DeliverablesPanel } from './DeliverablesPanel';
import { RescueReceiptCard, buildRescueReceipt, saveRescueReceipt } from './RescueReceipt';

const USAGE_LIMIT_MESSAGE = 'Monthly AI usage limit reached. Please try again next month.';

interface RescueModeProps {
  onInjectTasks: (tasks: Omit<Task, 'id' | 'createdAt'>[]) => Promise<void>;
  onBackToDashboard: () => void;
}

export const RescueMode: React.FC<RescueModeProps> = ({ onInjectTasks, onBackToDashboard }) => {
  const { user } = useAuth();
  const [panicText, setPanicText] = useState('');
  const [loading, setLoading] = useState(false);
  const [usageMessage, setUsageMessage] = useState('');
  const [rescueOutput, setRescueOutput] = useState<RescuePlan | null>(null);
  const [injecting, setInjecting] = useState(false);
  const [injectedSuccess, setInjectedSuccess] = useState(false);
  const [receipt, setReceipt] = useState<RescueReceipt | null>(null);

  const handleSpeechTranscript = useCallback((text: string) => {
    setPanicText((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const { listening, supported, secondsLeft, toggle: toggleVoice } = useSpeechInput(handleSpeechTranscript);

  const panicPrompts = [
    "Interview tomorrow at 9 AM completely unprepared for System Design",
    "Hackathon final demo due in 6 hours backend endpoint failing 500 error",
    "Final history paper due midnight haven't even picked a thesis statement",
    "Client pitch presentation in 3 hours missing half the financial slides"
  ];

  const handleGenerateRescue = async (textToUse?: string) => {
    const input = textToUse || panicText;
    if (!input.trim() || loading) return;

    if (textToUse) setPanicText(textToUse);
    setLoading(true);
    setUsageMessage('');
    setInjectedSuccess(false);
    setReceipt(null);

    try {
      const cached = await getCachedPlan<RescuePlan>(user?.uid ?? null, 'rescue', input);
      if (cached) {
        setRescueOutput(cached);
        return;
      }

      const usage = await getUserUsage(user?.uid ?? null);
      if (isRescueLimitReached(usage)) {
        setUsageMessage(USAGE_LIMIT_MESSAGE);
        return;
      }

      const res = await fetch('/api/ai/rescue-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panicText: input }),
      });

      if (res.status === 429) {
        setUsageMessage(USAGE_LIMIT_MESSAGE);
        return;
      }

      const data: RescuePlan = await res.json();
      await saveCachedPlan(user?.uid ?? null, 'rescue', input, data);
      await incrementRescueUsage(user?.uid ?? null);
      setRescueOutput(data);
    } catch (err) {
      console.error('Rescue AI error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = (idx: number) => {
    if (!rescueOutput) return;
    const updated = [...rescueOutput.timeBreakdown];
    updated[idx].status = updated[idx].status === 'completed' ? 'pending' : 'completed';
    setRescueOutput({ ...rescueOutput, timeBreakdown: updated });
  };

  const mapSubtasks = (subs: unknown[] | undefined, prefix: string) =>
    (subs || []).map((s, idx) =>
      typeof s === 'string'
        ? { id: `${prefix}_${idx}`, title: s, completed: false }
        : (s as { id?: string; title: string; completed?: boolean })
    ).map((s, idx) => ({
      id: s.id || `${prefix}_${idx}`,
      title: s.title,
      completed: s.completed ?? false,
    }));

  const handleInjectIntoDashboard = async () => {
    if (!rescueOutput || injecting) return;
    setInjecting(true);

    try {
      const tasksToInject: Omit<Task, 'id' | 'createdAt'>[] = [];

      if (rescueOutput.instantTasks && rescueOutput.instantTasks.length > 0) {
        rescueOutput.instantTasks.forEach((t, ti) => {
          tasksToInject.push({
            uid: '',
            title: t.title,
            deadline: t.deadline || 'Today ASAP',
            priority: 'Urgent',
            riskScore: t.riskScore || 85,
            subtasks: mapSubtasks(t.subtasks as unknown[], `rescue_sub_${ti}`),
            estimatedHours: t.estimatedHours || 2,
            status: 'pending',
          });
        });
      } else {
        tasksToInject.push({
          uid: '',
          title: rescueOutput.title || 'Emergency Protocol Task',
          deadline: 'Today ASAP',
          priority: 'Urgent',
          riskScore: 80,
          subtasks: rescueOutput.timeBreakdown.map((b, i) => ({
            id: `rescue_sub_${i}`,
            title: `${b.time}: ${b.action}`,
            completed: b.status === 'completed',
          })),
          estimatedHours: 4,
          status: 'pending',
        });
      }

      await onInjectTasks(tasksToInject);
      setInjectedSuccess(true);

      const newReceipt = buildRescueReceipt(
        panicText,
        rescueOutput.title,
        rescueOutput.riskReduction,
        rescueOutput.receiptPreview,
        rescueOutput.deliverables?.length || 0,
        tasksToInject.length
      );
      setReceipt(newReceipt);
      saveRescueReceipt(newReceipt);
    } catch (err) {
      console.error('Injection error:', err);
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#2D4A3E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Journal</span>
        </button>
        <span className="text-xs font-mono text-[#BF6B4E] uppercase font-bold flex items-center gap-1">
          <ShieldAlert className="w-4 h-4" />
          Emergency Command Center
        </span>
      </div>

      <div className="bg-[#BF6B4E] text-white rounded-3xl p-6 md:p-10 shadow-lg relative overflow-hidden mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase mb-4">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Panic Paralysis Override</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif italic mb-3">
            In severe deadline jeopardy?
          </h1>
          <p className="text-sm md:text-base text-white/90 font-sans font-light leading-relaxed">
            Type or speak your panic. Gemini maps the domino cascade, drafts ready-to-send deliverables, and builds your survival roadmap.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <div className="relative">
              <textarea
                value={panicText}
                onChange={(e) => setPanicText(e.target.value)}
                disabled={loading}
                rows={3}
                placeholder="e.g. 'Interview tomorrow at 9 AM completely unprepared for System design questions'"
                className="w-full bg-[#FDFBF7] text-[#1F1F1F] rounded-2xl p-4 pr-14 text-base md:text-lg font-serif italic placeholder-[#1F1F1F]/40 outline-none border border-transparent focus:border-[#2D4A3E] shadow-inner"
              />
              {supported && (
                <button
                  type="button"
                  onClick={() => toggleVoice(panicText)}
                  disabled={loading}
                  title={listening ? 'Stop voice input' : 'Voice panic dump (45s)'}
                  className={`absolute right-3 top-3 p-2.5 rounded-xl transition-all ${
                    listening
                      ? 'bg-[#BF6B4E] text-white animate-pulse'
                      : 'bg-[#2D4A3E]/10 text-[#2D4A3E] hover:bg-[#2D4A3E]/20'
                  }`}
                >
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleGenerateRescue()}
                disabled={!panicText.trim() || loading}
                className="bg-[#2D4A3E] hover:bg-[#233A30] disabled:opacity-40 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest font-mono shadow-xl transition-all flex items-center gap-3"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-[#BF6B4E]" />
                    <span>Synthesizing Survival Strategy...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-[#BF6B4E]" />
                    <span>Generate Emergency Rescue Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              {supported && (
                <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">
                  {listening ? `Listening… ${secondsLeft}s left` : 'Mic: up to 45s voice dump'}
                </span>
              )}
            </div>
          </div>
          {usageMessage && (
            <p className="text-[11px] text-white/90 mt-2 font-mono bg-white/10 px-3 py-2 rounded-xl inline-block">
              {usageMessage}
            </p>
          )}
        </div>

        <div className="absolute -right-12 -bottom-12 opacity-10 text-white pointer-events-none hidden md:block">
          <ShieldAlert className="w-96 h-96" />
        </div>
      </div>

      {!rescueOutput && !loading && (
        <div className="mb-12">
          <p className="text-xs font-mono text-[#1F1F1F]/50 uppercase font-bold mb-3">
            Or test an instant rescue scenario:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {panicPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleGenerateRescue(prompt)}
                className="text-left bg-[#F7F2EB] hover:bg-[#2D4A3E] hover:text-white border border-[#E5E0D8] p-4 rounded-2xl transition-all group flex items-start gap-3"
              >
                <span className="text-sm font-mono opacity-50 group-hover:opacity-100">0{i + 1}</span>
                <span className="text-xs md:text-sm font-serif italic font-medium leading-normal">&quot;{prompt}&quot;</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {rescueOutput && (
        <div className="flex flex-col gap-8 animate-fadeIn">
          <div className="bg-[#F7F2EB] border border-[#E5E0D8] rounded-3xl p-6 md:p-8 shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-[#E5E0D8] pb-6 mb-6 gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-[#BF6B4E]/10 text-[#BF6B4E] px-3 py-1 rounded-full">
                  {rescueOutput.riskReduction || 'Risk Mitigated'}
                </span>
                <h2 className="text-2xl md:text-3xl font-serif italic text-[#1F1F1F] mt-2 font-bold">
                  {rescueOutput.title}
                </h2>
              </div>

              <button
                onClick={handleInjectIntoDashboard}
                disabled={injecting || injectedSuccess}
                className={`px-5 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  injectedSuccess
                    ? 'bg-[#2D4A3E] text-white'
                    : 'bg-[#BF6B4E] hover:bg-[#A8583B] text-white shadow-md'
                }`}
              >
                {injectedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Injected to Queue!</span>
                  </>
                ) : injecting ? (
                  <span>Injecting...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Inject Tasks to Dashboard</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 mb-8 shadow-sm">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#2D4A3E] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#BF6B4E]" />
                Core Survival Creed
              </h3>
              <p className="text-base md:text-lg font-serif italic text-[#1F1F1F] leading-relaxed">
                &quot;{rescueOutput.survivalStrategy}&quot;
              </p>
            </div>

            {rescueOutput.cascade && (
              <div className="mb-8">
                <CascadeSimulator cascade={rescueOutput.cascade} />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="col-span-1 md:col-span-7 flex flex-col gap-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#1F1F1F]/60 mb-1">
                  ⏱️ Tactical Time Breakdown
                </h3>
                <div className="flex flex-col gap-2.5">
                  {rescueOutput.timeBreakdown.map((block, i) => (
                    <div
                      key={i}
                      onClick={() => handleToggleBlock(i)}
                      className={`bg-white border rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                        block.status === 'completed'
                          ? 'border-[#2D4A3E]/40 bg-[#2D4A3E]/5 opacity-70'
                          : 'border-[#E5E0D8] hover:border-[#BF6B4E] shadow-sm'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${
                          block.status === 'completed' ? 'bg-[#2D4A3E] border-[#2D4A3E] text-white' : 'border-[#E5E0D8]'
                        }`}
                      >
                        {block.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div className="grow">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#BF6B4E] font-bold block">
                          {block.time}
                        </span>
                        <p className={`text-sm font-medium text-[#1F1F1F] ${block.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                          {block.action}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-1 md:col-span-5 flex flex-col gap-4">
                <div className="bg-[#2D4A3E] text-white rounded-2xl p-6 shadow-md h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#BF6B4E] mb-4">
                      ⚡ Non-Negotiable Rules
                    </h3>
                    <ul className="flex flex-col gap-3.5">
                      {rescueOutput.priorityActions.map((act, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs md:text-sm font-mono leading-normal">
                          <span className="text-[#BF6B4E] font-bold shrink-0">→</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-8 pt-4 border-t border-white/10 text-[11px] font-mono text-white/50">
                    STATUS: RESCUE PROTOCOL ENGAGED
                  </div>
                </div>
              </div>
            </div>
          </div>

          {rescueOutput.deliverables && rescueOutput.deliverables.length > 0 && (
            <DeliverablesPanel deliverables={rescueOutput.deliverables} />
          )}

          {receipt && (
            <RescueReceiptCard receipt={receipt} onDismiss={() => setReceipt(null)} />
          )}
        </div>
      )}
    </div>
  );
};
