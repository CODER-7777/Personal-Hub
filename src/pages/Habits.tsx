import React, { useState } from "react";
import { useAppStore, Habit } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Plus, Trash2, Check, X, Calendar as CalendarIcon } from "lucide-react";
import { format, subDays, isSameDay, parseISO } from "date-fns";

export default function Habits() {
  const { habits, addHabit, removeHabit, toggleHabitDay } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🔥");

  // Generate last 7 days for the tracker
  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    addHabit({
      id: crypto.randomUUID(),
      name,
      icon,
      color: "#000000",
      createdAt: new Date().toISOString(),
      completions: []
    });
    setName("");
    setIcon("🔥");
    setShowAdd(false);
  };

  const calculateStreak = (habit: Habit) => {
    if (!habit.completions || habit.completions.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    
    // Check if completed today, if not, check yesterday to see if streak is still alive
    const todayStr = format(currentDate, "yyyy-MM-dd");
    const yesterdayStr = format(subDays(currentDate, 1), "yyyy-MM-dd");
    
    if (!habit.completions.includes(todayStr) && !habit.completions.includes(yesterdayStr)) {
      return 0; // Streak broken
    }

    // Start counting backwards
    let checkDate = habit.completions.includes(todayStr) ? currentDate : subDays(currentDate, 1);
    
    while (habit.completions.includes(format(checkDate, "yyyy-MM-dd"))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }
    
    return streak;
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2 flex items-center gap-3">
            <Flame className="w-8 h-8 md:w-10 md:h-10 text-orange-500 shrink-0" /> HABITS
          </h1>
          <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-sub">Track your daily routines.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-ink hover:bg-sub text-bg px-5 md:px-6 py-3 md:py-4 font-bold uppercase tracking-widest text-xs md:text-sm transition-all flex justify-center items-center gap-2 border-2 border-transparent hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 rounded-xl w-full md:w-auto mt-2 md:mt-0"
        >
          <Plus className="w-4 h-4" /> NEW HABIT
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-highlight border-2 border-ink rounded-2xl md:rounded-3xl p-5 md:p-8 overflow-hidden shadow-[4px_4px_0px_var(--theme-ink)]"
            onSubmit={handleAdd}
          >
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-2">Emoji</label>
                <input required value={icon} onChange={e => setIcon(e.target.value)} type="text" maxLength={2} className="w-full px-4 py-3 border-2 border-ink rounded-xl text-xl text-center bg-bg focus:outline-none focus:ring-2 focus:ring-ink" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-ink mb-2">Habit Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} type="text" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="e.g. Read 10 pages" />
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 md:py-4 text-ink hover:bg-bg border-2 border-transparent hover:border-ink rounded-xl font-bold uppercase tracking-widest text-xs transition-colors text-center w-full sm:w-auto">CANCEL</button>
              <button type="submit" className="px-6 py-3 md:py-4 bg-ink hover:bg-bg hover:text-ink text-bg border-2 border-ink rounded-xl font-bold uppercase tracking-widest text-xs transition-colors text-center w-full sm:w-auto">SAVE HABIT</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="bg-bg border-2 border-ink rounded-3xl overflow-hidden shadow-[4px_4px_0px_var(--theme-ink)]">
        <div className="overflow-x-auto">
          <div className="min-w-[600px] p-6">
            <div className="flex items-center mb-6 pl-48">
              {last7Days.map((date, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sub">{format(date, "EEE")}</span>
                  <span className={`text-sm font-extrabold ${isSameDay(date, today) ? 'text-ink bg-highlight px-2 py-1 rounded-md border-2 border-ink' : 'text-ink'}`}>
                    {format(date, "d")}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {habits.length === 0 ? (
                <div className="text-center py-10 text-[11px] font-bold uppercase tracking-widest text-sub border-2 border-dashed border-ink rounded-xl">
                  No habits tracked yet.
                </div>
              ) : (
                habits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-4 group">
                    <div className="w-44 flex items-center justify-between bg-line border-2 border-ink p-3 rounded-xl shrink-0">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xl">{habit.icon}</span>
                        <span className="font-bold text-sm truncate">{habit.name}</span>
                      </div>
                      <button 
                        onClick={() => removeHabit(habit.id)}
                        className="opacity-0 group-hover:opacity-100 text-sub hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1 flex items-center bg-highlight border-2 border-ink rounded-xl p-2 h-14">
                      {last7Days.map((date, i) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const isCompleted = habit.completions?.includes(dateStr);
                        return (
                          <div key={i} className="flex-1 flex justify-center">
                            <button
                              onClick={() => toggleHabitDay(habit.id, dateStr)}
                              className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                                isCompleted 
                                  ? 'bg-ink border-ink text-bg shadow-[2px_2px_0px_var(--theme-ink)] -translate-y-0.5' 
                                  : 'bg-bg border-sub hover:border-ink text-transparent hover:bg-line'
                              }`}
                            >
                              {isCompleted && <Check className="w-4 h-4" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="w-20 text-center shrink-0">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-sub">Streak</div>
                      <div className="text-xl font-extrabold text-orange-500 flex items-center justify-center gap-1">
                        {calculateStreak(habit)} <Flame className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
