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

interface AppState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  classes: ClassSession[];
  tasks: Task[];
  resources: Resource[];
  expenses: Expense[];
  reminders: Reminder[];
  
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      
      classes: [],
      tasks: [],
      resources: [],
      expenses: [],
      reminders: [],
      
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

// Initialize Firebase listener
export function initFirebaseSync() {
  if (!isFirebaseConfigured) return;

  onValue(ref(db, 'user_data'), (snapshot) => {
    const data = snapshot.val();
    if (data) {
      useAppStore.setState({
        classes: data.classes || [],
        tasks: data.tasks || [],
        resources: data.resources || [],
        expenses: data.expenses || [],
        reminders: data.reminders || [],
      });
    }
  });
}
