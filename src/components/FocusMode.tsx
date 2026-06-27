import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { ambientAudio } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Flame, CheckCircle2, ArrowLeft, Sparkles, Coffee } from 'lucide-react';

interface FocusModeProps {
  activeTask?: Task | null;
  onCompleteTask?: (taskId: string) => Promise<void>;
  onBackToDashboard: () => void;
}

export const FocusMode: React.FC<FocusModeProps> = ({ activeTask, onCompleteTask, onBackToDashboard }) => {
  const { profile, updateProfileTheme } = useAuth();
  
  const [environment, setEnvironment] = useState<'forest' | 'rain' | 'library'>(profile?.focusBackground || 'forest');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Timer State
  const FOCUS_SECONDS = 25 * 60;
  const BREAK_SECONDS = 5 * 60;
  const [timeLeft, setTimeLeft] = useState(FOCUS_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  useEffect(() => {
    if (profile?.focusBackground) {
      setEnvironment(profile.focusBackground);
    }
  }, [profile?.focusBackground]);

  // Audio Sync
  const toggleAudio = () => {
    if (isPlayingAudio) {
      ambientAudio.stop();
      setIsPlayingAudio(false);
    } else {
      ambientAudio.start(environment);
      setIsPlayingAudio(true);
    }
  };

  const switchEnv = (newEnv: 'forest' | 'rain' | 'library') => {
    setEnvironment(newEnv);
    updateProfileTheme(newEnv);
    if (isPlayingAudio) {
      ambientAudio.start(newEnv);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      ambientAudio.stop();
    };
  }, []);

  // Pomodoro Countdown
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (mode === 'focus') {
        setCompletedPomodoros(c => c + 1);
        setMode('break');
        setTimeLeft(BREAK_SECONDS);
      } else {
        setMode('focus');
        setTimeLeft(FOCUS_SECONDS);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  // Environment metadata
  const envConfigs = {
    forest: { title: 'Deep Forest', icon: '🌲', desc: 'Wind breeze & birds', bgClass: 'from-[#2D4A3E]/10 to-transparent' },
    rain: { title: 'Gentle Rain', icon: '🌧️', desc: 'Steady cozy rainfall', bgClass: 'from-[#3B5B6E]/10 to-transparent' },
    library: { title: 'Silent Library', icon: '📚', desc: 'Quiet focused room hum', bgClass: 'from-[#BF6B4E]/10 to-transparent' }
  };

  return (
    <div className={`max-w-4xl mx-auto pb-20 pt-2 transition-colors duration-1000`}>
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => { ambientAudio.stop(); onBackToDashboard(); }}
          className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase text-[#2D4A3E] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Zen Mode</span>
        </button>
        <div className="flex items-center gap-2 font-mono text-xs text-[#1F1F1F]/60">
          <Flame className="w-4 h-4 text-[#BF6B4E]" />
          <span>Completed Streaks: {completedPomodoros}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Main Timer Stage (Span 8) */}
        <section className="col-span-1 md:col-span-8 bg-[#F7F2EB] border border-[#E5E0D8] rounded-3xl p-8 md:p-12 shadow-md flex flex-col items-center justify-center relative overflow-hidden min-h-[480px]">
          {/* Subtle gradient backdrop */}
          <div className={`absolute inset-0 bg-gradient-to-b ${envConfigs[environment].bgClass} pointer-events-none`}></div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-8 z-10 bg-white/60 p-1.5 rounded-2xl border border-[#E5E0D8]">
            <button
              onClick={() => switchMode('focus')}
              className={`px-6 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                mode === 'focus' ? 'bg-[#2D4A3E] text-white shadow-sm' : 'text-[#1F1F1F]/70 hover:text-[#1F1F1F]'
              }`}
            >
              🔥 25m Deep Work
            </button>
            <button
              onClick={() => switchMode('break')}
              className={`px-6 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                mode === 'break' ? 'bg-[#BF6B4E] text-white shadow-sm' : 'text-[#1F1F1F]/70 hover:text-[#1F1F1F]'
              }`}
            >
              ☕ 5m Zen Break
            </button>
          </div>

          {/* Active Target Task Teaser */}
          {activeTask ? (
            <div className="z-10 mb-6 max-w-md text-center bg-white/80 px-4 py-2.5 rounded-2xl border border-[#E5E0D8] shadow-sm">
              <span className="text-[10px] font-mono text-[#BF6B4E] uppercase font-bold block">Locked Deadline Target</span>
              <p className="text-sm font-serif italic font-bold text-[#1F1F1F] truncate">{activeTask.title}</p>
            </div>
          ) : (
            <div className="z-10 mb-6 text-xs font-mono text-[#1F1F1F]/40 italic">
              — Universal Focus State —
            </div>
          )}

          {/* Giant Minimal Timer */}
          <div className="z-10 text-center my-4">
            <h1 className="text-8xl sm:text-9xl font-mono font-extrabold tracking-tight text-[#1F1F1F] select-none">
              {formatTime(timeLeft)}
            </h1>
            <p className="text-xs font-serif italic text-[#1F1F1F]/60 mt-3 tracking-widest uppercase font-mono">
              {isActive ? (mode === 'focus' ? '• eliminating distractions' : '• recharging synapses') : '• paused'}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mt-8 z-10">
            <button
              onClick={toggleTimer}
              className={`px-8 py-4 rounded-2xl font-mono font-bold text-sm uppercase tracking-widest shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${
                isActive
                  ? 'bg-white text-[#1F1F1F] border border-[#E5E0D8]'
                  : 'bg-[#2D4A3E] hover:bg-[#233A30] text-white'
              }`}
            >
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              <span>{isActive ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              onClick={resetTimer}
              title="Reset Timer"
              className="p-4 bg-white hover:bg-[#FDFBF7] text-[#1F1F1F]/70 hover:text-[#1F1F1F] rounded-2xl border border-[#E5E0D8] shadow-sm transition-all"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Complete Task shortcut if active */}
          {activeTask && activeTask.id && onCompleteTask && (
            <button
              onClick={() => { activeTask.id && onCompleteTask(activeTask.id); }}
              className="mt-8 z-10 text-xs font-mono text-[#2D4A3E] hover:text-[#BF6B4E] flex items-center gap-1.5 underline"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark "{activeTask.title.slice(0, 20)}..." Completed Now</span>
            </button>
          )}
        </section>

        {/* Right Sidebar: Environment Lab (Span 4) */}
        <section className="col-span-1 md:col-span-4 flex flex-col gap-6">
          <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#2D4A3E]">
                🧘 Ambient Synthesizer
              </span>
              <button
                onClick={toggleAudio}
                className={`p-2.5 rounded-xl transition-all ${
                  isPlayingAudio ? 'bg-[#2D4A3E] text-white shadow-md animate-pulse' : 'bg-[#F7F2EB] text-[#1F1F1F]/60'
                }`}
                title={isPlayingAudio ? "Mute Audio" : "Play Ambient Sound"}
              >
                {isPlayingAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-[#1F1F1F]/60 font-sans mb-4">
              Select an organic background hum generated locally via Web Audio:
            </p>

            <div className="flex flex-col gap-3">
              {(['forest', 'rain', 'library'] as const).map((env) => {
                const isSelected = environment === env;
                const cfg = envConfigs[env];
                return (
                  <button
                    key={env}
                    onClick={() => switchEnv(env)}
                    className={`flex items-center gap-4 p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#2D4A3E] bg-[#F7F2EB] shadow-sm'
                        : 'border-[#E5E0D8] hover:bg-[#F7F2EB]/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-inner shrink-0">
                      {cfg.icon}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold font-mono uppercase text-[#1F1F1F]">{cfg.title}</p>
                      <p className="text-[11px] text-[#1F1F1F]/50 truncate font-serif italic">{cfg.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-[#2D4A3E]"></div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E0D8] text-[10px] font-mono text-[#1F1F1F]/40 text-center">
              AUDIO GENERATOR: WEB_AUDIO_DSP // ZERO ASSET LAG
            </div>
          </div>

          <div className="bg-[#2D4A3E] text-white rounded-3xl p-6 shadow-md">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#BF6B4E] mb-2">
              📜 The Zen Creed
            </h4>
            <p className="text-sm font-serif italic leading-relaxed text-[#FDFBF7]/90">
              "Discipline is choosing between what you want right now, and what you want most."
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
