import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ref, onValue, set as dbSet } from "firebase/database";
import { db, isFirebaseConfigured } from "./lib/firebase";

export interface ClassSession {
  id: string;
  className: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // 'HH:mm'
  endTime: string;
  room?: string;
  type?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string; // ISO date
  priority: 'low' | 'medium' | 'high';
}

export interface Resource {
  id: string;
  title: string;
  url: string;
  category: string;
  notes?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string; // ISO date
  description: string;
  person?: string;
  type: 'income' | 'expense';
}

export interface Reminder {
  id: string;
  title: string;
  time: string; // ISO date
  triggered: boolean;
}

// ─── NEW FEATURE TYPES ─────────────────────────

export interface PomodoroSession {
  id: string;
  date: string; // ISO date
  duration: number; // minutes
  type: 'focus' | 'break';
  completedAt: string; // ISO datetime
}

export interface Habit {
  id: string;
  name: string;
  icon: string; // emoji
  color: string; // hex color
  createdAt: string;
  completions: string[]; // array of ISO date strings (YYYY-MM-DD)
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  color: string; // note color identifier
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  syncStatus: 'connected' | 'disconnected' | 'syncing';
  setSyncStatus: (s: 'connected' | 'disconnected' | 'syncing') => void;
  lastSyncTime: string | null;
  
  classes: ClassSession[];
  tasks: Task[];
  resources: Resource[];
  expenses: Expense[];
  reminders: Reminder[];
  
  // New feature state
  pomodoroSessions: PomodoroSession[];
  habits: Habit[];
  notes: QuickNote[];
  
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
  
  // Pomodoro actions
  addPomodoroSession: (session: PomodoroSession) => void;
  
  // Habit actions
  addHabit: (habit: Habit) => void;
  removeHabit: (id: string) => void;
  toggleHabitDay: (habitId: string, date: string) => void;
  
  // Notes actions
  addNote: (note: QuickNote) => void;
  updateNote: (id: string, updates: Partial<QuickNote>) => void;
  removeNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  
  // Force sync
  forceSync: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      
      syncStatus: 'disconnected',
      setSyncStatus: (s) => set({ syncStatus: s }),
      lastSyncTime: null,
      
      classes: [],
      tasks: [],
      resources: [],
      expenses: [],
      reminders: [],
      pomodoroSessions: [],
      habits: [],
      notes: [],
      
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
      
      // ─── POMODORO ─────────────────────
      addPomodoroSession: (session) => {
        const pomodoroSessions = [...get().pomodoroSessions, session];
        set({ pomodoroSessions });
        syncToFirebase('pomodoroSessions', pomodoroSessions);
      },
      
      // ─── HABITS ─────────────────────
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
      
      // ─── NOTES ─────────────────────
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
      
      // ─── FORCE SYNC ─────────────────────
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
        set({ lastSyncTime: new Date().toISOString() });
      },
    }),
    {
      name: 'personal-hub-storage',
    }
  )
);


// Helper to sync to Firebase
function syncToFirebase(key: string, data: any) {
  if (isFirebaseConfigured) {
    dbSet(ref(db, 'user_data/' + key), data);
  }
}

// Sanitize habit data from Firebase (Firebase converts [] to null)
function sanitizeHabits(rawHabits: any[]): Habit[] {
  if (!Array.isArray(rawHabits)) return [];
  return rawHabits.map(h => ({
    ...h,
    completions: Array.isArray(h.completions) ? h.completions : [],
  }));
}

// Initialize Firebase listener
export function initFirebaseSync() {
  if (!isFirebaseConfigured) return;

  // Listen to Firebase connection state
  onValue(ref(db, '.info/connected'), (snapshot) => {
    if (snapshot.val() === true) {
      useAppStore.setState({ syncStatus: 'connected' });
    } else {
      useAppStore.setState({ syncStatus: 'disconnected' });
    }
  });

  // Listen to data changes
  onValue(ref(db, 'user_data'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      useAppStore.setState({
        classes: Array.isArray(data.classes) ? data.classes : [],
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        resources: Array.isArray(data.resources) ? data.resources : [],
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
        reminders: Array.isArray(data.reminders) ? data.reminders : [],
        pomodoroSessions: Array.isArray(data.pomodoroSessions) ? data.pomodoroSessions : [],
        habits: sanitizeHabits(data.habits),
        notes: Array.isArray(data.notes) ? data.notes : [],
        lastSyncTime: new Date().toISOString(),
      });
    }
  });
}
