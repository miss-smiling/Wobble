import React, { useState } from 'react';
import { Task, Subtask, ParsedTaskResult, CascadeAnalysis } from '../types';
import { Sparkles, ArrowRight, ShieldAlert, CheckCircle2, Circle, Clock, Flame, ChevronDown, ChevronUp, Trash2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getUserUsage,
  isTaskLimitReached,
  incrementTaskUsage,
} from '../services/userUsage';
import { getCachedPlan, saveCachedPlan } from '../services/planCache';
import { CascadeSimulator } from './CascadeSimulator';
import { RiskFlowChart } from './RiskFlowChart';

const USAGE_LIMIT_MESSAGE = 'Monthly AI usage limit reached. Please try again next month.';

interface DashboardProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  onToggleTaskStatus: (taskId: string, currentStatus: 'pending' | 'completed') => Promise<void>;
  onToggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onSwitchToFocus: (task?: Task) => void;
  onSwitchToRescue: () => void;
  loadingTasks: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  onAddTask,
  onToggleTaskStatus,
  onToggleSubtask,
  onDeleteTask,
  onSwitchToFocus,
  onSwitchToRescue,
  loadingTasks
}) => {
  const { user } = useAuth();
  const [messyInput, setMessyInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [usageMessage, setUsageMessage] = useState('');
  const [lastCascade, setLastCascade] = useState<CascadeAnalysis | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Calculate overall risk
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const avgRisk = pendingTasks.length > 0
    ? Math.round(pendingTasks.reduce((acc, t) => acc + (t.riskScore || 50), 0) / pendingTasks.length)
    : 12;

  const handleQuickDump = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messyInput.trim() || isParsing) return;

    setIsParsing(true);
    setUsageMessage('');
    try {
      const cached = await getCachedPlan<ParsedTaskResult>(user?.uid ?? null, 'task', messyInput);
      let parsed: ParsedTaskResult;

      if (cached) {
        parsed = cached;
      } else {
        const usage = await getUserUsage(user?.uid ?? null);
        if (isTaskLimitReached(usage)) {
          setUsageMessage(USAGE_LIMIT_MESSAGE);
          return;
        }

        const res = await fetch('/api/ai/parse-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: messyInput }),
        });

        if (res.status === 429) {
          setUsageMessage(USAGE_LIMIT_MESSAGE);
          return;
        }

        parsed = await res.json();
        await saveCachedPlan(user?.uid ?? null, 'task', messyInput, parsed);
        await incrementTaskUsage(user?.uid ?? null);
      }

      const newSubtasks: Subtask[] = (parsed.subtasks || []).map((s: string, idx: number) => ({
        id: `sub_${Date.now()}_${idx}`,
        title: s,
        completed: false,
      }));

      await onAddTask({
        uid: '',
        title: parsed.title || messyInput.slice(0, 30),
        deadline: parsed.deadline || 'Tomorrow, 11:59 PM',
        priority: parsed.priority || 'High',
        riskScore: typeof parsed.riskScore === 'number' ? parsed.riskScore : 65,
        subtasks: newSubtasks,
        estimatedHours: typeof parsed.estimatedHours === 'number' ? parsed.estimatedHours : 2.5,
        status: 'pending',
      });

      if (parsed.cascade) setLastCascade(parsed.cascade);
      setMessyInput('');
    } catch (err) {
      console.error('AI Dump error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-12">
      {/* 1. AI Quick Dump Input Area (Span 8) */}
      <section className="col-span-1 md:col-span-8 bg-[#F7F2EB] border border-[#E5E0D8] rounded-2xl p-4 md:p-6 shadow-sm flex flex-col justify-center">
        <form onSubmit={handleQuickDump} className="flex items-center gap-3 md:gap-4">
          <div className="bg-[#2D4A3E] p-3 rounded-xl shadow-md shrink-0 text-white">
            {isParsing ? (
              <Sparkles className="w-5 h-5 animate-spin text-[#BF6B4E]" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
          </div>
          <input
            type="text"
            value={messyInput}
            onChange={(e) => setMessyInput(e.target.value)}
            disabled={isParsing}
            placeholder="Dump messy thoughts... e.g. 'Hackathon project due Sunday need frontend backend'"
            className="bg-transparent border-none outline-none w-full text-base md:text-lg placeholder-[#1F1F1F]/40 italic font-serif text-[#1F1F1F]"
          />
          <button
            type="submit"
            disabled={!messyInput.trim() || isParsing}
            className="bg-[#2D4A3E] hover:bg-[#233A30] disabled:opacity-40 text-white px-5 py-3 rounded-xl font-medium text-xs uppercase tracking-wider font-mono transition-all shrink-0 flex items-center gap-2"
          >
            <span>{isParsing ? 'Structuring...' : 'Rescue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-[11px] text-[#1F1F1F]/50 mt-2 pl-1 font-mono flex items-center gap-2">
          <span>✨ Gemini AI auto-generates deadlines, risk score (0-100), effort hours, and subtasks.</span>
        </p>
        {usageMessage && (
          <p className="text-[11px] text-[#BF6B4E] mt-2 pl-1 font-mono">{usageMessage}</p>
        )}
      </section>

      {/* 2. Risk Flow Chart (Span 4) */}
      <section className="col-span-1 md:col-span-4">
        <RiskFlowChart riskScore={avgRisk} />
      </section>

      {lastCascade && (
        <section className="col-span-1 md:col-span-12">
          <CascadeSimulator cascade={lastCascade} />
        </section>
      )}

      {/* 3. Today's Tasks List Area (Span 8) */}
      <section className="col-span-1 md:col-span-8 flex flex-col gap-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#2D4A3E] font-mono">
            Today's Rescue Execution Queue ({pendingTasks.length})
          </h2>
          {loadingTasks && <span className="text-xs text-[#BF6B4E] font-mono animate-pulse">Syncing...</span>}
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white border border-[#E5E0D8] border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F7F2EB] flex items-center justify-center text-[#BF6B4E]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif italic text-xl text-[#1F1F1F]">No deadlines in jeopardy... yet.</h3>
            <p className="text-xs text-[#1F1F1F]/60 max-w-sm">
              Dump your messy project notes in the bar above. AI will extract actionable subtasks and calculate your failure risk.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {tasks.map((task) => {
              const isDone = task.status === 'completed';
              const isExpanded = expandedTaskId === task.id;
              const completedSubs = (task.subtasks || []).filter(s => s.completed).length;
              const totalSubs = (task.subtasks || []).length;
              const riskColor = task.riskScore >= 75 ? '#BF6B4E' : task.riskScore >= 45 ? '#D9822B' : '#2D4A3E';

              return (
                <div
                  key={task.id}
                  className={`bg-white border border-[#E5E0D8] rounded-2xl p-4 md:p-5 transition-all shadow-sm ${
                    isDone ? 'opacity-60 bg-[#F7F2EB]/40' : 'hover:border-[#2D4A3E]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Status Indicator Pill */}
                    <div
                      className="w-1.5 self-stretch rounded-full shrink-0"
                      style={{ backgroundColor: isDone ? '#E5E0D8' : riskColor }}
                    ></div>

                    {/* Completion Toggle */}
                    <button
                      onClick={() => task.id && onToggleTaskStatus(task.id, task.status)}
                      className="mt-0.5 text-[#2D4A3E] hover:scale-110 transition-transform"
                      title={isDone ? "Mark Pending" : "Mark Completed"}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-[#2D4A3E]" />
                      ) : (
                        <Circle className="w-6 h-6 text-[#E5E0D8] hover:text-[#2D4A3E]" />
                      )}
                    </button>

                    {/* Main Task Info */}
                    <div className="flex-grow min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F2EB] border border-[#E5E0D8] text-[#1F1F1F]/70">
                          {task.priority || 'Normal'}
                        </span>
                        <span className="text-[10px] font-mono text-[#BF6B4E] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.deadline}
                        </span>
                        <span className="text-[10px] font-mono text-[#1F1F1F]/50">
                          • {task.estimatedHours}h est.
                        </span>
                      </div>

                      <h3 className={`font-bold text-base md:text-lg text-[#1F1F1F] truncate ${isDone ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </h3>

                      {/* Subtasks summary tag */}
                      {totalSubs > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => setExpandedTaskId(isExpanded ? null : (task.id || null))}
                            className="text-xs font-mono text-[#2D4A3E] hover:underline flex items-center gap-1"
                          >
                            <span>AI Subtasks ({completedSubs}/{totalSubs})</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Risk Badge & Actions */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] font-mono uppercase tracking-wider block text-[#1F1F1F]/40">Risk Score</span>
                        <span className="font-mono font-bold text-sm" style={{ color: riskColor }}>
                          {task.riskScore}/100
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isDone && (
                          <button
                            onClick={() => onSwitchToFocus(task)}
                            className="bg-[#2D4A3E] hover:bg-[#233A30] text-white px-3.5 py-2 rounded-xl text-xs font-medium uppercase font-mono tracking-wider shadow-sm transition-all flex items-center gap-1"
                          >
                            <Flame className="w-3 h-3 text-[#BF6B4E]" />
                            <span>Focus</span>
                          </button>
                        )}

                        <button
                          onClick={() => task.id && onDeleteTask(task.id)}
                          className="p-2 text-[#1F1F1F]/40 hover:text-[#BF6B4E] hover:bg-[#F7F2EB] rounded-xl transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Subtasks Queue */}
                  {isExpanded && totalSubs > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#E5E0D8]/60 pl-8 flex flex-col gap-2 bg-[#FDFBF7]/60 p-3 rounded-xl">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#2D4A3E] font-bold mb-1">
                        AI Execution Breakdown:
                      </p>
                      {task.subtasks.map((sub) => (
                        <label
                          key={sub.id}
                          className="flex items-center gap-3 text-xs text-[#1F1F1F] cursor-pointer hover:bg-white p-2 rounded-lg transition-colors border border-transparent hover:border-[#E5E0D8]"
                        >
                          <input
                            type="checkbox"
                            checked={sub.completed}
                            onChange={() => task.id && onToggleSubtask(task.id, sub.id)}
                            className="accent-[#2D4A3E] w-4 h-4 rounded cursor-pointer"
                          />
                          <span className={sub.completed ? 'line-through text-[#1F1F1F]/40' : 'font-medium'}>
                            {sub.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Rescue Mode Banner CTA */}
        <div className="mt-4 bg-[#BF6B4E] text-white rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest bg-white/20 px-2 py-0.5 rounded font-bold">
              Emergency Protocol
            </span>
            <h2 className="text-xl md:text-2xl font-serif italic mt-1">Total deadline panic?</h2>
            <p className="text-xs md:text-sm text-white/80 mt-0.5">
              Input raw anxiety like "Interview tomorrow completely unprepared". AI builds your survival schedule.
            </p>
          </div>
          <button
            onClick={onSwitchToRescue}
            className="bg-white text-[#BF6B4E] hover:bg-[#FDFBF7] font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest shadow-xl font-mono transition-transform hover:scale-105 shrink-0"
          >
            Activate Rescue Mode
          </button>
        </div>
      </section>

      {/* 4. Right Sidebar Widget Column (Span 4) */}
      <section className="col-span-1 md:col-span-4 flex flex-col gap-6">
        {/* Motivational Flip Card */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="bg-[#2D4A3E] rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer min-h-[200px] flex flex-col justify-between shadow-md transition-transform active:scale-98 group"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#F7F2EB]/60 font-mono">
                {isFlipped ? "⚡ BLUNT REALITY CHECK" : "📜 PRODUCTIVITY JOURNAL"}
              </p>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white/80 group-hover:bg-white/20">
                Click to flip ↻
              </span>
            </div>

            {isFlipped ? (
              <div className="animate-fadeIn">
                <p className="text-lg md:text-xl font-mono font-bold leading-relaxed text-[#BF6B4E]">
                  "Procrastination is just fear wearing a mask of laziness. Stop researching. Write one imperfect line right now."
                </p>
                <p className="text-xs mt-3 text-white/70 font-mono">
                  → Rule: The 5-Minute Contract. Work on your hardest task for 300 seconds. If you hate it, you can stop.
                </p>
              </div>
            ) : (
              <div className="animate-fadeIn">
                <p className="text-xl md:text-2xl font-serif italic leading-tight text-[#FDFBF7]">
                  "The best time to plant a tree was 20 years ago. The second best time is today."
                </p>
                <p className="text-xs mt-4 text-[#F7F2EB]/60 font-serif not-italic">
                  — Chinese Proverb // Deadline Rescue Creed
                </p>
              </div>
            )}
          </div>

          <div className="absolute -bottom-6 -right-6 text-white opacity-5 pointer-events-none">
            <Clock className="w-48 h-48" />
          </div>
        </div>

        {/* Focus Mode Teaser Bento Card */}
        <div className="bg-[#F7F2EB] border border-[#E5E0D8] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2D4A3E] font-mono">
              Focus Environment
            </span>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2D4A3E]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#BF6B4E]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#D9822B]"></div>
            </div>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="w-14 h-14 rounded-2xl bg-[#2D4A3E] text-white flex items-center justify-center text-2xl shadow-sm">
              🌲
            </div>
            <div>
              <p className="font-bold text-base text-[#1F1F1F]">Zen Focus Lab</p>
              <p className="text-xs text-[#1F1F1F]/60">Synthetic Forest, Rain & White Noise</p>
            </div>
          </div>

          <button
            onClick={() => onSwitchToFocus()}
            className="w-full mt-4 border-2 border-[#2D4A3E] hover:bg-[#2D4A3E] hover:text-white text-[#2D4A3E] font-bold py-3 rounded-xl text-xs uppercase font-mono tracking-widest transition-all"
          >
            Enter Zen Pomodoro State
          </button>
        </div>
      </section>
    </div>
  );
};
