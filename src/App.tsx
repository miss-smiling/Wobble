import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { RescueMode } from './components/RescueMode';
import { FocusMode } from './components/FocusMode';
import { Archives } from './components/Archives';
import { LegalPrivacy } from './components/LegalPrivacy';
import { LegalTerms } from './components/LegalTerms';
import { Task } from './types';
import { db, TASKS_COLLECTION } from './firebase';
import { collection, query, where, getDocs, setDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import confetti from 'canvas-confetti';

const SAMPLE_TASKS: Task[] = [
  {
    id: 'demo_1',
    uid: 'demo',
    title: 'Vanguard App Deployment & Auth Fix',
    deadline: 'Tomorrow, 11:59 PM',
    priority: 'Urgent',
    riskScore: 82,
    estimatedHours: 14,
    status: 'pending',
    createdAt: Date.now() - 3600000,
    subtasks: [
      { id: 'sub_1', title: 'Complete React frontend UI polish', completed: true },
      { id: 'sub_2', title: 'Verify Firebase Google Sign-in flow', completed: false },
      { id: 'sub_3', title: 'Bundle production server.cjs build', completed: false },
      { id: 'sub_4', title: 'Deploy container to Cloud Run staging', completed: false }
    ]
  },
  {
    id: 'demo_2',
    uid: 'demo',
    title: "Client Pitch Proposal: 'Horizon'",
    deadline: 'Today, 5:00 PM',
    priority: 'High',
    riskScore: 74,
    estimatedHours: 2.5,
    status: 'pending',
    createdAt: Date.now() - 7200000,
    subtasks: [
      { id: 'sub_21', title: 'Draft executive summary slide', completed: true },
      { id: 'sub_22', title: 'Insert updated Q3 revenue projections', completed: true },
      { id: 'sub_23', title: 'Export PDF and send calendar invite', completed: false }
    ]
  },
  {
    id: 'demo_3',
    uid: 'demo',
    title: 'Quarterly Tax Preparation & Receipts',
    deadline: '14 Days Left',
    priority: 'Low',
    riskScore: 18,
    estimatedHours: 4,
    status: 'pending',
    createdAt: Date.now() - 86400000,
    subtasks: [
      { id: 'sub_31', title: 'Categorize business software expenses', completed: false },
      { id: 'sub_32', title: 'Upload invoices to CPA portal', completed: false }
    ]
  }
];

type LegalPage = 'privacy' | 'terms' | null;

function getLegalPageFromPath(): LegalPage {
  const path = window.location.pathname;
  if (path === '/legal/privacy') return 'privacy';
  if (path === '/legal/terms') return 'terms';
  return null;
}

const MainContent: React.FC = () => {
  const { user } = useAuth();
  const [legalPage, setLegalPage] = useState<LegalPage>(getLegalPageFromPath);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rescue' | 'focus' | 'archives'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);

  useEffect(() => {
    const onPopState = () => setLegalPage(getLegalPageFromPath());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateToLegal = (page: 'privacy' | 'terms') => {
    const path = page === 'privacy' ? '/legal/privacy' : '/legal/terms';
    window.history.pushState({}, '', path);
    setLegalPage(page);
    window.scrollTo(0, 0);
  };

  const navigateHome = () => {
    window.history.pushState({}, '', '/');
    setLegalPage(null);
    window.scrollTo(0, 0);
  };

  // Load tasks from Firestore when user logs in, or localStorage fallback
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) {
        const local = localStorage.getItem('deadline_rescue_tasks');
        if (local) {
          try { setTasks(JSON.parse(local)); } catch(e) {}
        } else {
          setTasks(SAMPLE_TASKS);
        }
        return;
      }

      setLoadingTasks(true);
      try {
        const tasksRef = collection(db, TASKS_COLLECTION);
        const q = query(tasksRef, where('uid', '==', user.uid));
        const snap = await getDocs(q);
        const fetched: Task[] = [];
        snap.forEach(d => {
          fetched.push({ id: d.id, ...d.data() } as Task);
        });
        
        // Sort by status and risk
        fetched.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
        
        if (fetched.length > 0) {
          setTasks(fetched);
        } else {
          // Seed initial demo tasks for new user
          const seeded = SAMPLE_TASKS.map(t => ({ ...t, uid: user.uid, id: `seed_${Date.now()}_${Math.random()}` }));
          for (const st of seeded) {
            if (st.id) {
              await setDoc(doc(db, TASKS_COLLECTION, st.id), st);
            }
          }
          setTasks(seeded);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [user]);

  // Sync to local storage if guest
  const syncGuestLocal = (newTasks: Task[]) => {
    if (!user) {
      localStorage.setItem('deadline_rescue_tasks', JSON.stringify(newTasks));
    }
  };

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      uid: user ? user.uid : 'guest',
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: Date.now()
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    syncGuestLocal(updated);

    if (user && newTask.id) {
      try {
        await setDoc(doc(db, TASKS_COLLECTION, newTask.id), newTask);
      } catch (err) {
        console.error("Firestore add error:", err);
      }
    }
  };

  const handleInjectMultipleTasks = async (taskBatch: Omit<Task, 'id' | 'createdAt'>[]) => {
    const newItems: Task[] = taskBatch.map((t, idx) => ({
      ...t,
      uid: user ? user.uid : 'guest',
      id: `rescue_${Date.now()}_${idx}`,
      createdAt: Date.now()
    }));

    const updated = [...newItems, ...tasks];
    setTasks(updated);
    syncGuestLocal(updated);

    if (user) {
      for (const item of newItems) {
        if (item.id) {
          try { await setDoc(doc(db, TASKS_COLLECTION, item.id), item); } catch(e){}
        }
      }
    }
    setActiveTab('dashboard');
  };

  const handleToggleStatus = async (taskId: string, currentStatus: 'pending' | 'completed') => {
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
    if (newStatus === 'completed') {
      try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } }); } catch(e) {}
    }

    const updated = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    setTasks(updated);
    syncGuestLocal(updated);

    if (user) {
      try {
        await updateDoc(doc(db, TASKS_COLLECTION, taskId), { status: newStatus });
      } catch (err) {
        console.error("Update status error:", err);
      }
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const updatedSubs = (target.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );

    const updated = tasks.map(t => t.id === taskId ? { ...t, subtasks: updatedSubs } : t);
    setTasks(updated);
    syncGuestLocal(updated);

    if (user) {
      try {
        await updateDoc(doc(db, TASKS_COLLECTION, taskId), { subtasks: updatedSubs });
      } catch (err) {
        console.error("Update subtask error:", err);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    syncGuestLocal(updated);

    if (user) {
      try {
        await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
      } catch (err) {
        console.error("Delete task error:", err);
      }
    }
  };

  const handleSwitchToFocus = (task?: Task) => {
    if (task) setActiveFocusTask(task);
    setActiveTab('focus');
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1F1F1F] font-sans p-4 md:p-8 selection:bg-[#BF6B4E] selection:text-white">
      <div className="max-w-7xl mx-auto">
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tasksCount={tasks.filter(t => t.status === 'pending').length}
        />

        <main className="transition-opacity duration-300">
          {legalPage === 'privacy' && <LegalPrivacy onBack={navigateHome} />}
          {legalPage === 'terms' && <LegalTerms onBack={navigateHome} />}

          {!legalPage && activeTab === 'dashboard' && (
            <Dashboard
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTaskStatus={handleToggleStatus}
              onToggleSubtask={handleToggleSubtask}
              onDeleteTask={handleDeleteTask}
              onSwitchToFocus={handleSwitchToFocus}
              onSwitchToRescue={() => setActiveTab('rescue')}
              loadingTasks={loadingTasks}
            />
          )}

          {!legalPage && activeTab === 'rescue' && (
            <RescueMode
              onInjectTasks={handleInjectMultipleTasks}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {!legalPage && activeTab === 'focus' && (
            <FocusMode
              activeTask={activeFocusTask || (tasks.find(t => t.status === 'pending') || null)}
              onCompleteTask={async (tid) => handleToggleStatus(tid, 'pending')}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}

          {!legalPage && activeTab === 'archives' && (
            <Archives
              tasks={tasks}
              onToggleTaskStatus={handleToggleStatus}
              onDeleteTask={handleDeleteTask}
              onBackToDashboard={() => setActiveTab('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Footer minimal signature */}
      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#E5E0D8] text-center text-xs font-mono text-[#1F1F1F]/40 flex flex-col gap-4 pb-6">
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
          <button
            type="button"
            onClick={() => navigateToLegal('privacy')}
            className="hover:text-[#2D4A3E] transition-colors underline-offset-2 hover:underline"
          >
            Privacy Policy
          </button>
          <span className="hidden sm:inline">•</span>
          <button
            type="button"
            onClick={() => navigateToLegal('terms')}
            className="hover:text-[#2D4A3E] transition-colors underline-offset-2 hover:underline"
          >
            Terms of Service
          </button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="uppercase tracking-wider text-[10px]">Powered by</span>
          <span>Gemini API • Firebase Authentication • Cloud Firestore • Google Cloud</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
