import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { CheckCircle2, Clock, Trash2, ArrowLeft, Trophy, Sparkles, FileText } from 'lucide-react';
import { loadRescueReceipts } from './RescueReceipt';
import { RescueReceipt } from '../types';

interface ArchivesProps {
  tasks: Task[];
  onToggleTaskStatus: (taskId: string, currentStatus: 'pending' | 'completed') => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onBackToDashboard: () => void;
}

export const Archives: React.FC<ArchivesProps> = ({ tasks, onToggleTaskStatus, onDeleteTask, onBackToDashboard }) => {
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const [receipts, setReceipts] = useState<RescueReceipt[]>([]);

  useEffect(() => {
    setReceipts(loadRescueReceipts());
  }, []);

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#2D4A3E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Journal</span>
        </button>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2D4A3E] uppercase">
          <Trophy className="w-4 h-4 text-[#BF6B4E]" />
          <span>Rescued Deadlines Log ({completedTasks.length})</span>
        </div>
      </div>

      {receipts.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#BF6B4E] uppercase mb-4">
            <FileText className="w-4 h-4" />
            <span>Near-Miss Rescue Receipts ({receipts.length})</span>
          </div>
          <div className="flex flex-col gap-3">
            {receipts.slice(0, 5).map((r) => (
              <div key={r.id} className="bg-[#F7F2EB] border border-[#E5E0D8] rounded-2xl p-4 shadow-sm">
                <p className="text-sm font-serif italic font-bold text-[#1F1F1F]">{r.headline}</p>
                <p className="text-xs text-[#1F1F1F]/60 mt-1 font-mono">
                  {new Date(r.createdAt).toLocaleString()} • {r.riskReduction}
                </p>
                <p className="text-xs text-[#1F1F1F]/70 mt-2 line-clamp-2">{r.verdict}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedTasks.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#F7F2EB] flex items-center justify-center text-[#1F1F1F]/40">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-serif italic text-xl text-[#1F1F1F]">No archived achievements yet.</h3>
          <p className="text-xs text-[#1F1F1F]/60 max-w-sm">
            When you complete tasks in your main Journal queue, they will be preserved safely here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="bg-[#2D4A3E] text-white p-6 rounded-3xl flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-xl font-serif italic">Hall of Rescued Deadlines</h2>
              <p className="text-xs text-white/80 mt-1">Every completed checkmark is disaster averted.</p>
            </div>
            <Sparkles className="w-8 h-8 text-[#BF6B4E] shrink-0" />
          </div>

          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-[#E5E0D8] rounded-2xl p-5 flex items-center justify-between shadow-sm opacity-80 hover:opacity-100 transition-opacity"
            >
              <div className="flex items-center gap-4 min-w-0">
                <button
                  onClick={() => task.id && onToggleTaskStatus(task.id, 'completed')}
                  title="Restore to active queue"
                  className="text-[#2D4A3E] hover:scale-110 transition-transform shrink-0"
                >
                  <CheckCircle2 className="w-6 h-6 text-[#2D4A3E]" />
                </button>
                <div className="min-w-0">
                  <h4 className="font-bold text-base text-[#1F1F1F] truncate line-through opacity-70">
                    {task.title}
                  </h4>
                  <p className="text-[10px] font-mono text-[#1F1F1F]/50">
                    Rescued • Originally due: {task.deadline} • {task.estimatedHours}h effort
                  </p>
                </div>
              </div>

              <button
                onClick={() => task.id && onDeleteTask(task.id)}
                className="p-2 text-[#1F1F1F]/40 hover:text-[#BF6B4E] rounded-xl transition-colors shrink-0"
                title="Delete Permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
