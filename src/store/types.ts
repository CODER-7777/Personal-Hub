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

export interface Goal {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  deadline: string; // ISO date
  category?: string;
}

export interface MonthlyGoal {
  id: string;
  title: string;
  month: number; // 0-11
  year: number;
  type: 'progress' | 'custom';
  targetCount?: number;
  currentCount?: number;
  completed?: boolean;
}
