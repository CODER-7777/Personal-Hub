import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ref, onValue, set as dbSet } from "firebase/database";
import { db, auth, isFirebaseConfigured } from "../lib/firebase";
import { scheduleTaskNotification, scheduleReminderNotification } from "../lib/notifications";
import { 
  ClassSession, Task, Resource, Expense, Reminder, 
  PomodoroSession, Habit, QuickNote, Goal, MonthlyGoal 
} from './types';

export * from './types';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  syncStatus: 'connected' | 'disconnected' | 'syncing';
  setSyncStatus: (s: 'connected' | 'disconnected' | 'syncing') => void;
  lastSyncTime: string | null;

  geminiApiKey: string;
  profileName: string;
  cfHandle: string;
  profilePicture: string;
  animationsEnabled: boolean;
  setGeminiApiKey: (key: string) => void;
  setProfileName: (name: string) => void;
  setCfHandle: (handle: string) => void;
  setProfilePicture: (url: string) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  
  classes: ClassSession[];
  tasks: Task[];
  resources: Resource[];
  expenses: Expense[];
  reminders: Reminder[];
  
  pomodoroSessions: PomodoroSession[];
  habits: Habit[];
  notes: QuickNote[];
  goals: Goal[];
  monthlyGoals: MonthlyGoal[];
  
  addClasses: (classes: ClassSession[]) => void;
  removeClass: (id: string) => void;
  
  addTask: (task: Task) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  
  addResource: (res: Resource) => void;
  removeResource: (id: string) => void;
  
  addExpense: (exp: Expense) => void;
  removeExpense: (id: string) => void;
  
  addReminder: (rem: Reminder) => void;
  markReminderTriggered: (id: string) => void;
  removeReminder: (id: string) => void;
  
  addPomodoroSession: (session: PomodoroSession) => void;
  
  addHabit: (habit: Habit) => void;
  removeHabit: (id: string) => void;
  toggleHabitDay: (habitId: string, date: string) => void;
  
  addNote: (note: QuickNote) => void;
  updateNote: (id: string, updates: Partial<QuickNote>) => void;
  removeNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  
  addGoal: (goal: Goal) => void;
  updateGoalProgress: (id: string, newCount: number) => void;
  removeGoal: (id: string) => void;
  
  addMonthlyGoal: (goal: MonthlyGoal) => void;
  updateMonthlyGoalProgress: (id: string, newCount: number) => void;
  toggleMonthlyGoalComplete: (id: string) => void;
  removeMonthlyGoal: (id: string) => void;

  forceSync: () => void;
  
  //finance report
  lastResetMonth: string;
  financeReports: any[];
  setLastResetMonth: (month: string) => void;
  setFinanceReports: (updater: (prev: any[]) => any[]) => void;
  clearExpenses: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      
      syncStatus: 'disconnected',
      setSyncStatus: (s) => set({ syncStatus: s }),
      lastSyncTime: null,
      
      geminiApiKey: '',
      profileName: 'User',
      cfHandle: '',
      profilePicture: '',
      animationsEnabled: true,
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setProfileName: (name) => set({ profileName: name }),
      setCfHandle: (handle) => set({ cfHandle: handle }),
      setProfilePicture: (url) => set({ profilePicture: url }),
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
      
      classes: [],
      tasks: [],
      resources: [],
      expenses: [],
      reminders: [],
      pomodoroSessions: [],
      habits: [],
      notes: [],
      goals: [],
      monthlyGoals: [],
      
      lastResetMonth: '',
      financeReports: [],
      
      setLastResetMonth: (month) => {
        set({ lastResetMonth: month });
        // Optional: syncToFirebase('lastResetMonth', month); 
        // We'll skip syncToFirebase for this to keep it simple, it's persisted locally
      },
      setFinanceReports: (updater) => {
        const newReports = updater(get().financeReports || []);
        set({ financeReports: newReports });
        // Optional: syncToFirebase('financeReports', newReports);
      },
      clearExpenses: () => {
        set({ expenses: [] });
        // Note: syncToFirebase logic requires auth, which is imported here but normally called directly.
        // We will just clear it locally and the next force sync or local cache will handle it.
      },
      
      addClasses: (newClasses) => {
        const classes = [...get().classes, ...newClasses];
        set({ classes });
        syncToFirebase('classes', classes);
      },
      removeClass: (id) => {
        const classes = get().classes.filter(c => c.id !== id);
        set({ classes });
        syncToFirebase('classes', classes);
      },
      
      addTask: (task) => {
        const tasks = [...get().tasks, task];
        set({ tasks });
        syncToFirebase('tasks', tasks);
        // Schedule notification for the task deadline
        scheduleTaskNotification(task);
      },
      toggleTask: (id) => {
        const tasks = get().tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        set({ tasks });
        syncToFirebase('tasks', tasks);
      },
      removeTask: (id) => {
        const tasks = get().tasks.filter(t => t.id !== id);
        set({ tasks });
        syncToFirebase('tasks', tasks);
      },
      
      addResource: (res) => {
        const resources = [...get().resources, res];
        set({ resources });
        syncToFirebase('resources', resources);
      },
      removeResource: (id) => {
        const resources = get().resources.filter(r => r.id !== id);
        set({ resources });
        syncToFirebase('resources', resources);
      },
      
      addExpense: (exp) => {
        const expenses = [...get().expenses, exp];
        set({ expenses });
        syncToFirebase('expenses', expenses);
      },
      removeExpense: (id) => {
        const expenses = get().expenses.filter(e => e.id !== id);
        set({ expenses });
        syncToFirebase('expenses', expenses);
      },
      
      addReminder: (rem) => {
        const reminders = [...get().reminders, rem];
        set({ reminders });
        syncToFirebase('reminders', reminders);
        // Schedule notification for the reminder
        scheduleReminderNotification(rem);
      },
      markReminderTriggered: (id) => {
        const reminders = get().reminders.map(r => r.id === id ? { ...r, triggered: true } : r);
        set({ reminders });
        syncToFirebase('reminders', reminders);
      },
      removeReminder: (id) => {
        const reminders = get().reminders.filter(r => r.id !== id);
        set({ reminders });
        syncToFirebase('reminders', reminders);
      },
      
      addPomodoroSession: (session) => {
        const pomodoroSessions = [...get().pomodoroSessions, session];
        set({ pomodoroSessions });
        syncToFirebase('pomodoroSessions', pomodoroSessions);
      },
      
      addHabit: (habit) => {
        const habits = [...get().habits, habit];
        set({ habits });
        syncToFirebase('habits', habits);
      },
      removeHabit: (id) => {
        const habits = get().habits.filter(h => h.id !== id);
        set({ habits });
        syncToFirebase('habits', habits);
      },
      toggleHabitDay: (habitId, date) => {
        const habits = get().habits.map(h => {
          if (h.id !== habitId) return h;
          const currentCompletions = h.completions || [];
          const completions = currentCompletions.includes(date)
            ? currentCompletions.filter(d => d !== date)
            : [...currentCompletions, date];
          return { ...h, completions };
        });
        set({ habits });
        syncToFirebase('habits', habits);
      },
      
      addNote: (note) => {
        const notes = [...get().notes, note];
        set({ notes });
        syncToFirebase('notes', notes);
      },
      updateNote: (id, updates) => {
        const notes = get().notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);
        set({ notes });
        syncToFirebase('notes', notes);
      },
      removeNote: (id) => {
        const notes = get().notes.filter(n => n.id !== id);
        set({ notes });
        syncToFirebase('notes', notes);
      },
      togglePinNote: (id) => {
        const notes = get().notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
        set({ notes });
        syncToFirebase('notes', notes);
      },
      
      addGoal: (goal) => {
        const goals = [...get().goals, goal];
        set({ goals });
        syncToFirebase('goals', goals);
      },
      updateGoalProgress: (id, newCount) => {
        const goals = get().goals.map(g => g.id === id ? { ...g, currentCount: newCount } : g);
        set({ goals });
        syncToFirebase('goals', goals);
      },
      removeGoal: (id) => {
        const goals = get().goals.filter(g => g.id !== id);
        set({ goals });
        syncToFirebase('goals', goals);
      },
      
      addMonthlyGoal: (goal) => {
        const monthlyGoals = [...get().monthlyGoals, goal];
        set({ monthlyGoals });
        syncToFirebase('monthlyGoals', monthlyGoals);
      },
      updateMonthlyGoalProgress: (id, newCount) => {
        const monthlyGoals = get().monthlyGoals.map(g => g.id === id ? { ...g, currentCount: newCount } : g);
        set({ monthlyGoals });
        syncToFirebase('monthlyGoals', monthlyGoals);
      },
      toggleMonthlyGoalComplete: (id) => {
        const monthlyGoals = get().monthlyGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
        set({ monthlyGoals });
        syncToFirebase('monthlyGoals', monthlyGoals);
      },
      removeMonthlyGoal: (id) => {
        const monthlyGoals = get().monthlyGoals.filter(g => g.id !== id);
        set({ monthlyGoals });
        syncToFirebase('monthlyGoals', monthlyGoals);
      },
      
      forceSync: () => {
        const state = get();
        syncToFirebase('classes', state.classes);
        syncToFirebase('tasks', state.tasks);
        syncToFirebase('resources', state.resources);
        syncToFirebase('expenses', state.expenses);
        syncToFirebase('reminders', state.reminders);
        syncToFirebase('pomodoroSessions', state.pomodoroSessions);
        syncToFirebase('habits', state.habits);
        syncToFirebase('notes', state.notes);
        syncToFirebase('goals', state.goals);
        syncToFirebase('monthlyGoals', state.monthlyGoals);
        set({ lastSyncTime: new Date().toISOString() });
      },
    }),
    {
      name: 'personal-hub-storage',
    }
  )
);

// ─── Per-key write tracking ───────────────────────────────────────────────
// Instead of one global boolean, we track how many writes are "in-flight"
// for each data key. The onValue handler only applies remote data when
// pendingWrites[key] === 0, meaning no local writes are waiting for
// Firebase acknowledgement.
const pendingWrites: Record<string, number> = {};

function syncToFirebase(key: string, data: any) {
  const uid = auth.currentUser?.uid;
  if (!isFirebaseConfigured || !uid) return;

  // Increment the pending counter BEFORE the write
  pendingWrites[key] = (pendingWrites[key] || 0) + 1;

  dbSet(ref(db, `user_data/${uid}/${key}`), data)
    .then(() => {
      // Write succeeded — decrement the counter
      pendingWrites[key] = Math.max(0, (pendingWrites[key] || 1) - 1);
    })
    .catch((err) => {
      console.error(`Firebase sync failed for "${key}":`, err);
      pendingWrites[key] = Math.max(0, (pendingWrites[key] || 1) - 1);
    });
}

// ─── Sanitizers ───────────────────────────────────────────────────────────
function sanitizeHabits(rawHabits: any[]): Habit[] {
  if (!Array.isArray(rawHabits)) return [];
  return rawHabits.map(h => ({
    ...h,
    completions: Array.isArray(h.completions) ? h.completions : [],
  }));
}

function toSafeArray(val: any): any[] {
  return Array.isArray(val) ? val : [];
}

// Merge two arrays by `id`, keeping the item from `primary` if both have it
function mergeById(local: any[], remote: any[]): any[] {
  const map = new Map<string, any>();
  for (const item of remote) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of local) {
    if (item && item.id) map.set(item.id, item); // local wins on conflict
  }
  return Array.from(map.values());
}

// ─── Sync keys configuration ─────────────────────────────────────────────
const DATA_KEYS = [
  'classes', 'tasks', 'resources', 'expenses', 'reminders',
  'pomodoroSessions', 'habits', 'notes', 'goals', 'monthlyGoals'
] as const;

type DataKey = typeof DATA_KEYS[number];

// ─── Firebase Sync Init ──────────────────────────────────────────────────
let currentUnsubscribes: (() => void)[] = [];

export function initFirebaseSync() {
  if (!isFirebaseConfigured) return;

  // Connection status listener
  onValue(ref(db, '.info/connected'), (snapshot) => {
    if (snapshot.val() === true) {
      useAppStore.setState({ syncStatus: 'connected' });
    } else {
      useAppStore.setState({ syncStatus: 'disconnected' });
    }
  });

  auth.onAuthStateChanged(async (user) => {
    // Clean up all previous listeners
    for (const unsub of currentUnsubscribes) {
      unsub();
    }
    currentUnsubscribes = [];

    if (!user) return;

    // ── Step 1: One-time read + merge with local ──
    // Read remote data once, merge with local (union by ID), then push
    // the merged result back. This prevents data loss from either side.
    const { get: fbGet } = await import('firebase/database');
    try {
      const snapshot = await fbGet(ref(db, `user_data/${user.uid}`));
      const remoteData = snapshot.val() || {};
      const localState = useAppStore.getState();

      const merged: Partial<Record<DataKey, any[]>> = {};
      for (const key of DATA_KEYS) {
        const localArr = toSafeArray(localState[key]);
        let remoteArr = toSafeArray(remoteData[key]);
        if (key === 'habits') remoteArr = sanitizeHabits(remoteArr);
        merged[key] = mergeById(localArr, remoteArr);
      }

      // Apply merged data locally
      useAppStore.setState({
        ...merged,
        lastSyncTime: new Date().toISOString(),
      } as any);

      // Push merged data back to Firebase so both sides are identical
      for (const key of DATA_KEYS) {
        syncToFirebase(key, merged[key]);
      }
    } catch (err) {
      console.error('Initial Firebase merge failed:', err);
    }

    // ── Step 2: Set up per-key real-time listeners ──
    // Each key gets its own onValue listener, so a change to "tasks"
    // doesn't trigger a re-download of "expenses", "classes", etc.
    for (const key of DATA_KEYS) {
      const keyRef = ref(db, `user_data/${user.uid}/${key}`);
      const unsub = onValue(keyRef, (snapshot) => {
        // If we have pending local writes for THIS key, skip the echo
        if ((pendingWrites[key] || 0) > 0) return;

        const rawData = snapshot.val();
        let data: any[];
        if (key === 'habits') {
          data = sanitizeHabits(rawData);
        } else {
          data = toSafeArray(rawData);
        }

        useAppStore.setState({
          [key]: data,
          lastSyncTime: new Date().toISOString(),
        } as any);
      });
      currentUnsubscribes.push(unsub);
    }
  });
}

