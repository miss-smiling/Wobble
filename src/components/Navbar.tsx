import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Timer, CheckCircle2, LogOut, LogIn, LayoutDashboard } from 'lucide-react';
import { WobbleBrand } from './WobbleBrand';

interface NavbarProps {
  activeTab: 'dashboard' | 'rescue' | 'focus' | 'archives';
  setActiveTab: (tab: 'dashboard' | 'rescue' | 'focus' | 'archives') => void;
  tasksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, tasksCount }) => {
  const { user, profile, login, logout, signingIn } = useAuth();

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#E5E0D8] pb-6">
      <div>
        <WobbleBrand size="lg" />
        <p className="text-lg md:text-xl font-serif italic text-[#1F1F1F]/70 mt-3">
          What are we saving today?
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        <nav className="flex items-center bg-[#F7F2EB] p-1.5 rounded-2xl border border-[#E5E0D8]">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#2D4A3E] text-white shadow-md'
                : 'text-[#1F1F1F]/70 hover:text-[#1F1F1F]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Journal</span>
            {tasksCount > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full ${activeTab === 'dashboard' ? 'bg-[#BF6B4E] text-white' : 'bg-[#E5E0D8] text-[#1F1F1F]'}`}>
                {tasksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rescue')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'rescue'
                ? 'bg-[#BF6B4E] text-white shadow-md'
                : 'text-[#BF6B4E] hover:bg-[#BF6B4E]/10'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
            <span>Rescue Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('focus')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'focus'
                ? 'bg-[#2D4A3E] text-white shadow-md'
                : 'text-[#1F1F1F]/70 hover:text-[#1F1F1F]'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Focus Lab</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archives')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'archives'
                ? 'bg-[#2D4A3E] text-white shadow-md'
                : 'text-[#1F1F1F]/70 hover:text-[#1F1F1F]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Saved</span>
          </button>
        </nav>

        <div className="flex items-center gap-3 pl-2 border-l border-[#E5E0D8]">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase tracking-wider text-[#1F1F1F]/50 font-mono">Rescuer Profile</p>
                <p className="font-medium text-xs text-[#1F1F1F] truncate max-w-[120px]">{profile?.name || user.displayName || 'Rescuer'}</p>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-[#E5E0D8] object-cover shadow-sm" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#2D4A3E] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
                  {(profile?.name || 'R').charAt(0).toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-xl text-[#1F1F1F]/60 hover:text-[#BF6B4E] hover:bg-[#F7F2EB] transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => login()}
              disabled={signingIn}
              className="flex items-center gap-2 bg-[#2D4A3E] hover:bg-[#233A30] disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{signingIn ? 'Signing in…' : 'Google Sign-In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
