import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ref, onValue, runTransaction } from "firebase/database";
import { db, auth, isFirebaseConfigured } from "../lib/firebase";
import { scheduleTaskNotification, scheduleReminderNotification } from "../lib/notifications";
import { 
  ClassSession, Task, Resource, Expense, Reminder, 
  PomodoroSession, Habit, QuickNote, Goal, MonthlyGoal 
} from './types';

import { applyChange, diffRecords, safeArray, SyncChange } from './syncChanges';

export * from './types';

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  
  syncStatus: 'connected' | 'disconnected' | 'syncing' | 'error';
  setSyncStatus: (s: 'connected' | 'disconnected' | 'syncing' | 'error') => void;
  lastSyncTime: string | null;
  syncReady: boolean;
  syncOwnerUid: string | null;
  syncError: string | null;
  pendingSyncCount: number;

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
  updateClass: (id: string, updates: Partial<ClassSession>) => void;
  
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
  
  clearUserData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      
      syncStatus: 'disconnected',
      setSyncStatus: (s) => set({ syncStatus: s }),
      lastSyncTime: null,
      syncReady: false,
      syncOwnerUid: null,
      syncError: null,
      pendingSyncCount: 0,
      
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
      },
      setFinanceReports: (updater) => {
        const newReports = updater(get().financeReports || []);
        set({ financeReports: newReports });
      },
      clearExpenses: () => {
        set({ expenses: [] });
      },
      
      clearUserData: () => {
        set({
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
          financeReports: [],
          profileName: '',
          cfHandle: '',
          profilePicture: '',
          geminiApiKey: '',
          lastResetMonth: '',
          lastSyncTime: null,
          syncOwnerUid: null,
          syncReady: false,
          syncError: null,
          pendingSyncCount: 0,
          syncStatus: 'disconnected'
        });
      },
      
      addClasses: (newClasses) => {
        const classes = [...get().classes, ...newClasses];
        set({ classes });
      },
      updateClass: (id, updates) => {
        set({ classes: get().classes.map(c => c.id === id ? { ...c, ...updates, id } : c) });
      },
      removeClass: (id) => {
        const classes = get().classes.filter(c => c.id !== id);
        set({ classes });
      },
      
      addTask: (task) => {
        const tasks = [...get().tasks, task];
        set({ tasks });
        // Schedule notification for the task deadline
        scheduleTaskNotification(task);
      },
      toggleTask: (id) => {
        const tasks = get().tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        set({ tasks });
      },
      removeTask: (id) => {
        const tasks = get().tasks.filter(t => t.id !== id);
        set({ tasks });
      },
      
      addResource: (res) => {
        const resources = [...get().resources, res];
        set({ resources });
      },
      removeResource: (id) => {
        const resources = get().resources.filter(r => r.id !== id);
        set({ resources });
      },
      
      addExpense: (exp) => {
        const expenses = [...get().expenses, exp];
        set({ expenses });
      },
      removeExpense: (id) => {
        const expenses = get().expenses.filter(e => e.id !== id);
        set({ expenses });
      },
      
      addReminder: (rem) => {
        const reminders = [...get().reminders, rem];
        set({ reminders });
        // Schedule notification for the reminder
        scheduleReminderNotification(rem);
      },
      markReminderTriggered: (id) => {
        const reminders = get().reminders.map(r => r.id === id ? { ...r, triggered: true } : r);
        set({ reminders });
      },
      removeReminder: (id) => {
        const reminders = get().reminders.filter(r => r.id !== id);
        set({ reminders });
      },
      
      addPomodoroSession: (session) => {
        const pomodoroSessions = [...get().pomodoroSessions, session];
        set({ pomodoroSessions });
      },
      
      addHabit: (habit) => {
        const habits = [...get().habits, habit];
        set({ habits });
      },
      removeHabit: (id) => {
        const habits = get().habits.filter(h => h.id !== id);
        set({ habits });
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
      },
      
      addNote: (note) => {
        const notes = [...get().notes, note];
        set({ notes });
      },
      updateNote: (id, updates) => {
        const notes = get().notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n);
        set({ notes });
      },
      removeNote: (id) => {
        const notes = get().notes.filter(n => n.id !== id);
        set({ notes });
      },
      togglePinNote: (id) => {
        const notes = get().notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
        set({ notes });
      },
      
      addGoal: (goal) => {
        const goals = [...get().goals, goal];
        set({ goals });
      },
      updateGoalProgress: (id, newCount) => {
        const goals = get().goals.map(g => g.id === id ? { ...g, currentCount: newCount } : g);
        set({ goals });
      },
      removeGoal: (id) => {
        const goals = get().goals.filter(g => g.id !== id);
        set({ goals });
      },
      
      addMonthlyGoal: (goal) => {
        const monthlyGoals = [...get().monthlyGoals, goal];
        set({ monthlyGoals });
      },
      updateMonthlyGoalProgress: (id, newCount) => {
        const monthlyGoals = get().monthlyGoals.map(g => g.id === id ? { ...g, currentCount: newCount } : g);
        set({ monthlyGoals });
      },
      toggleMonthlyGoalComplete: (id) => {
        const monthlyGoals = get().monthlyGoals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
        set({ monthlyGoals });
      },
      removeMonthlyGoal: (id) => {
        const monthlyGoals = get().monthlyGoals.filter(g => g.id !== id);
        set({ monthlyGoals });
      },
      
      forceSync: () => { retrySync(); },
    }),
    {
      name: 'personal-hub-storage',
      partialize: ({ geminiApiKey, syncStatus, syncReady, syncError, pendingSyncCount, ...state }) => state,
      merge: (persisted, current) => {
        const { geminiApiKey, syncStatus, syncReady, syncError, pendingSyncCount, ...saved } = (persisted || {}) as Partial<AppState>;
        return { ...current, ...saved };
      },
    }
  )
);

const DATA_KEYS = [
  'classes', 'tasks', 'resources', 'expenses', 'reminders', 'pomodoroSessions',
  'habits', 'notes', 'goals', 'monthlyGoals', 'financeReports'
] as const;
const PROFILE_KEYS = ['profileName', 'cfHandle', 'profilePicture'] as const;
const SYNC_KEYS = [...DATA_KEYS, 'profile'];
let applyingRemote = false;
let activeUid: string | null = null;
let generation = 0;
let connected = false;
let pending: SyncChange[] = [];
let flushingGeneration: number | null = null;
let unsubscribes: (() => void)[] = [];
let initialized = false;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = 1000;
let storageError: string | null = null;
let startSession: ((user: typeof auth.currentUser) => void) | undefined;
let latestRemote: Record<string, unknown> = {};
let remoteVersions: Record<string, number> = {};

function preserveUnownedCache(): boolean {
  const state = useAppStore.getState();
  if (state.syncOwnerUid || !DATA_KEYS.some(key => state[key].length)) return true;
  try {
    // Earlier versions never recorded cache ownership. Preserve a recovery copy;
    // never attribute that data to the next account or automatically upload it.
    const backup = Object.fromEntries([...DATA_KEYS, ...PROFILE_KEYS, 'lastResetMonth'].map(key => [key, state[key as keyof AppState]]));
    localStorage.setItem('personal-hub-legacy-recovery', JSON.stringify({ ...backup, savedAt: new Date().toISOString() }));
    return true;
  } catch {
    setRemote({ syncReady: false, syncError: 'The previous app data could not be backed up. Free device storage and retry before signing in.' });
    return false;
  }
}

function setRemote(state: Partial<AppState>) {
  applyingRemote = true;
  try { useAppStore.setState(state); } finally { applyingRemote = false; }
}

const queueKey = (uid: string) => `personal-hub-outbox:${uid}`;
function saveQueue(uid: string, queue: SyncChange[]) {
  try {
    if (queue.length) localStorage.setItem(queueKey(uid), JSON.stringify(queue));
    else localStorage.removeItem(queueKey(uid));
    storageError = null;
  } catch {
    storageError = 'Device storage is full or unavailable. Keep this app open until changes sync.';
  }
}

function updateStatus() {
  const state = useAppStore.getState();
  setRemote({
    pendingSyncCount: pending.length,
    syncStatus: state.syncError || storageError ? 'error' : !activeUid || !connected ? 'disconnected'
      : pending.length || !state.syncReady ? 'syncing' : 'connected',
    ...(storageError ? { syncError: storageError } : {}),
  });
}

function overlay(key: string, remote: unknown) {
  return pending.filter(change => change.key === key).reduce(applyChange, remote);
}

function applySnapshot(key: string, value: unknown) {
  const data = overlay(key, value);
  if (key === 'profile') {
    const profile = data as Record<string, unknown> | null;
    const fallbackName = auth.currentUser?.displayName || 'User';
    setRemote({
      profileName: typeof profile?.profileName === 'string' ? profile.profileName : fallbackName,
      cfHandle: typeof profile?.cfHandle === 'string' ? profile.cfHandle : '',
      profilePicture: typeof profile?.profilePicture === 'string' ? profile.profilePicture : '',
    });
  } else {
    let list = safeArray(data);
    if (key === 'habits') list = list.map(h => ({ ...h, completions: Array.isArray(h.completions) ? h.completions : [] }));
    setRemote({ [key]: list });
  }
}

async function flushQueue() {
  const epoch = generation;
  const uid = activeUid;
  const queue = pending;
  if (!uid || !connected || !useAppStore.getState().syncReady || flushingGeneration === epoch) return;
  flushingGeneration = epoch;
  updateStatus();
  try {
    while (queue.length && generation === epoch && connected && auth.currentUser?.uid === uid) {
      const change = queue[0];
      const remoteVersion = remoteVersions[change.key] || 0;
      const result = await runTransaction(ref(db, `user_data/${uid}/${change.key}`), current => {
        if (generation !== epoch || auth.currentUser?.uid !== uid) return;
        return applyChange(current, change);
      }, { applyLocally: false });
      if (!result.committed) break;
      queue.shift();
      // Save the acknowledgement even if this session ended during the request.
      saveQueue(uid, queue);
      if (generation !== epoch) break;
      // A newer live snapshot can arrive before this acknowledgement resolves.
      // Do not replace it with an older transaction result.
      const acknowledged = (remoteVersions[change.key] || 0) > remoteVersion
        ? latestRemote[change.key] : result.snapshot.val();
      applySnapshot(change.key, acknowledged);
      setRemote({ lastSyncTime: new Date().toISOString(), syncError: storageError });
      retryDelay = 1000;
    }
  } catch (error) {
    if (generation === epoch) {
      console.error('Cloud sync failed:', error);
      setRemote({ syncError: 'Cloud sync failed. Your changes are queued on this device. Tap sync to retry.' });
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => { if (generation === epoch) void flushQueue(); }, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 30000);
    }
  } finally {
    if (flushingGeneration === epoch) flushingGeneration = null;
    if (generation === epoch) updateStatus();
  }
}

function retrySync() {
  if (!activeUid) return;
  clearTimeout(retryTimer);
  setRemote({ syncError: null });
  if (!useAppStore.getState().syncReady) startSession?.(auth.currentUser);
  else { saveQueue(activeUid, pending); void flushQueue(); }
  updateStatus();
}

export function initFirebaseSync() {
  if (!isFirebaseConfigured || initialized) return;
  initialized = true;
  // One subscription records only user edits, never cloud hydration or status updates.
  useAppStore.subscribe((state, previous) => {
    if (applyingRemote || !activeUid || !state.syncReady || state.syncOwnerUid !== activeUid || auth.currentUser?.uid !== activeUid) return;
    const changes: SyncChange[] = [];
    for (const key of DATA_KEYS) {
      if (state[key] === previous[key]) continue;
      const records = diffRecords(previous[key], state[key]);
      if (records.length) changes.push({ token: crypto.randomUUID(), key, records });
    }
    const fields: Record<string, unknown> = {};
    for (const key of PROFILE_KEYS) if (state[key] !== previous[key]) fields[key] = state[key];
    if (Object.keys(fields).length) changes.push({ token: crypto.randomUUID(), key: 'profile', fields });
    if (!changes.length) return;
    pending.push(...changes);
    saveQueue(activeUid, pending);
    updateStatus();
    void flushQueue();
  });

  onValue(ref(db, '.info/connected'), snapshot => {
    connected = snapshot.val() === true;
    updateStatus();
    if (connected) void flushQueue();
  });

  startSession = user => {
    const epoch = ++generation;
    clearTimeout(retryTimer);
    for (const unsubscribe of unsubscribes) unsubscribe();
    unsubscribes = [];
    activeUid = user?.uid || null;
    pending = [];
    storageError = null;
    latestRemote = {};
    remoteVersions = {};
    if (!preserveUnownedCache()) { updateStatus(); return; }
    if (!user) {
      applyingRemote = true;
      try { useAppStore.getState().clearUserData(); } finally { applyingRemote = false; }
      return;
    }
    const sameOwner = useAppStore.getState().syncOwnerUid === user.uid;
    if (!sameOwner) {
      applyingRemote = true;
      try { useAppStore.getState().clearUserData(); } finally { applyingRemote = false; }
    }
    try {
      const queue = JSON.parse(localStorage.getItem(queueKey(user.uid)) || '[]');
      if (!Array.isArray(queue) || queue.some(c => !c || !SYNC_KEYS.includes(c.key) || typeof c.token !== 'string')) throw new Error('Invalid outbox');
      pending = queue;
    } catch {
      storageError = 'Saved pending changes could not be read. Export your local data before clearing device storage.';
    }
    setRemote({ syncOwnerUid: user.uid, syncReady: sameOwner, syncError: storageError, pendingSyncCount: pending.length });
    for (const key of SYNC_KEYS) {
      const cached = key === 'profile' ? Object.fromEntries(PROFILE_KEYS.map(k => [k, useAppStore.getState()[k]])) : useAppStore.getState()[key as typeof DATA_KEYS[number]];
      applySnapshot(key, cached);
    }
    const received = new Set<string>();
    for (const key of SYNC_KEYS) {
      unsubscribes.push(onValue(ref(db, `user_data/${user.uid}/${key}`), snapshot => {
        if (epoch !== generation || auth.currentUser?.uid !== user.uid) return;
        latestRemote[key] = snapshot.val();
        remoteVersions[key] = (remoteVersions[key] || 0) + 1;
        applySnapshot(key, snapshot.val());
        received.add(key);
        if (received.size === SYNC_KEYS.length) {
          setRemote({ syncReady: true, syncError: storageError, ...(connected && !pending.length ? { lastSyncTime: new Date().toISOString() } : {}) });
          void flushQueue();
        }
        updateStatus();
      }, error => {
        if (epoch !== generation) return;
        console.error(`Cloud read failed for ${key}:`, error);
        setRemote({ syncError: 'Cloud data could not be loaded. Check your connection and account permissions, then retry.' });
        updateStatus();
      }));
    }
    updateStatus();
  };
  auth.onAuthStateChanged(startSession);
}

