import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ref, onValue, set as dbSet } from "firebase/database";
import { db, isFirebaseConfigured } from "../lib/firebase";
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
  animationsEnabled: boolean;
  setGeminiApiKey: (key: string) => void;
  setProfileName: (name: string) => void;
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
      animationsEnabled: true,
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),
      setProfileName: (name) => set({ profileName: name }),
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

function syncToFirebase(key: string, data: any) {
  if (isFirebaseConfigured) {
    dbSet(ref(db, 'user_data/' + key), data);
  }
}

function sanitizeHabits(rawHabits: any[]): Habit[] {
  if (!Array.isArray(rawHabits)) return [];
  return rawHabits.map(h => ({
    ...h,
    completions: Array.isArray(h.completions) ? h.completions : [],
  }));
}

export function initFirebaseSync() {
  if (!isFirebaseConfigured) return;

  onValue(ref(db, '.info/connected'), (snapshot) => {
    if (snapshot.val() === true) {
      useAppStore.setState({ syncStatus: 'connected' });
    } else {
      useAppStore.setState({ syncStatus: 'disconnected' });
    }
  });

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
        goals: Array.isArray(data.goals) ? data.goals : [],
        monthlyGoals: Array.isArray(data.monthlyGoals) ? data.monthlyGoals : [],
        lastSyncTime: new Date().toISOString(),
      });
    }
  });
}
