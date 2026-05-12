import { useState } from "react";
import { useAppStore, Habit } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Check, Flame, Target, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";

const HABIT_COLORS = [
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Rose", hex: "#e11d48" },
  { name: "Emerald", hex: "#059669" },
  { name: "Amber", hex: "#d97706" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Cyan", hex: "#0891b2" },
];

const HABIT_ICONS = ["🏋️", "📚", "💧", "🧘", "💻", "✍️", "🎵", "🌙", "🍎", "🚀", "🎯", "💡"];

export default function Habits() {
  const { habits, addHabit, removeHabit, toggleHabitDay } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("🎯");
  const [newColor, setNewColor] = useState(HABIT_COLORS[0].hex);

  const today = new Date().toISOString().split('T')[0];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addHabit({
      id: crypto.randomUUID(),
      name: newName.trim(),
      icon: newIcon,
      color: newColor,
      createdAt: new Date().toISOString(),
      completions: [],
    });
    setNewName("");
    setShowAdd(false);
    toast.success("Habit added! Start building your streak 🔥");
  };

  const getStreak = (habit: Habit): number => {
    const sorted = [...habit.completions].sort().reverse();
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (sorted.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  };

  const getLongestStreak = (habit: Habit): number => {
    const sorted = [...habit.completions].sort();
    let longest = 0;
    let current = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) {
        current = 1;
      } else {
        const prevDate = new Date(sorted[i - 1]);
        const currDate = new Date(sorted[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / 86400000);
        if (diffDays === 1) {
          current++;
        } else {
          current = 1;
        }
      }
      longest = Math.max(longest, current);
    }
    return longest;
  };

  // Generate last 84 days (12 weeks) for the heatmap
  const generateHeatmapDays = () => {
    const days: string[] = [];
    const date = new Date();
    for (let i = 83; i >= 0; i--) {
      const d = new Date(date);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const heatmapDays = generateHeatmapDays();

  // Group into weeks (7 per column)
  const weeks: string[][] = [];
  for (let i = 0; i < heatmapDays.length; i += 7) {
    weeks.push(heatmapDays.slice(i, i + 7));
  }

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink flex items-center gap-2 md:gap-3">
            <Target className="w-8 h-8 md:w-10 md:h-10 text-ink flex-shrink-0" /> HABIT TRACKER
          </h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub mt-1 md:mt-2">Build consistency. One day at a time.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-ink hover:bg-sub text-bg px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex justify-center items-center gap-2 border-2 border-transparent rounded-xl w-full md:w-auto hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1"
        >
          <Plus className="w-4 h-4" /> NEW HABIT
        </button>
      </div>

      {/* Add Habit Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-highlight border-2 border-ink rounded-2xl md:rounded-3xl p-5 md:p-8 overflow-hidden shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)]"
            onSubmit={handleAdd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-2">Habit Name</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink"
                  placeholder="e.g. Drink 2L water, Read 30 pages..."
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {HABIT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setNewIcon(icon)}
                      className={`w-9 h-9 text-lg flex items-center justify-center rounded-lg border-2 transition-all ${
                        newIcon === icon ? 'border-ink bg-ink text-bg shadow-[2px_2px_0px_var(--theme-ink)]' : 'border-ink bg-bg hover:bg-line'
                      }`}
                    >{icon}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-2">Color</label>
              <div className="flex gap-3">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setNewColor(c.hex)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newColor === c.hex ? 'border-ink scale-110 shadow-[2px_2px_0px_var(--theme-ink)]' : 'border-transparent hover:border-ink'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-ink hover:bg-bg border-2 border-transparent rounded-xl hover:border-ink font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-colors text-center">CANCEL</button>
              <button type="submit" className="px-6 py-3 bg-ink hover:bg-bg hover:text-ink text-bg rounded-xl border-2 border-ink font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-colors text-center">CREATE HABIT</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Habits Grid */}
      {habits.length > 0 ? (
        <div className="space-y-6">
          {habits.map((habit, i) => {
            const streak = getStreak(habit);
            const longestStreak = getLongestStreak(habit);
            const completedToday = habit.completions.includes(today);
            const completionRate = heatmapDays.length > 0 
              ? Math.round((heatmapDays.filter(d => habit.completions.includes(d)).length / heatmapDays.length) * 100)
              : 0;

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-bg border-2 border-ink rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] overflow-hidden"
              >
                {/* Habit Header */}
                <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-ink">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div 
                      className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-2xl rounded-xl border-2 border-ink"
                      style={{ backgroundColor: habit.color + '20' }}
                    >
                      {habit.icon}
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-ink">{habit.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-sub flex items-center gap-1">
                          <Flame className="w-3 h-3" style={{ color: habit.color }} /> {streak}d streak
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-sub">
                          Best: {longestStreak}d
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-sub flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> {completionRate}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Today's toggle */}
                    <button
                      onClick={() => toggleHabitDay(habit.id, today)}
                      className={`flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl border-2 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all ${
                        completedToday
                          ? 'border-ink bg-ink text-bg shadow-[2px_2px_0px_var(--theme-ink)]'
                          : 'border-ink text-ink hover:bg-highlight'
                      }`}
                    >
                      {completedToday ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      {completedToday ? 'DONE TODAY' : 'MARK TODAY'}
                    </button>
                    <button
                      onClick={() => { removeHabit(habit.id); toast.info("Habit removed"); }}
                      className="p-2 text-sub hover:text-red-500 border-2 border-transparent hover:border-red-500 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Contribution Heatmap */}
                <div className="p-4 md:p-6 overflow-x-auto">
                  <div className="flex gap-[3px] min-w-max">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-[3px]">
                        {week.map((day) => {
                          const isCompleted = habit.completions.includes(day);
                          const isToday = day === today;
                          return (
                            <button
                              key={day}
                              onClick={() => toggleHabitDay(habit.id, day)}
                              title={`${day}${isCompleted ? ' ✓' : ''}`}
                              className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-[3px] border transition-all hover:scale-125 ${
                                isToday ? 'border-ink' : 'border-transparent'
                              }`}
                              style={{
                                backgroundColor: isCompleted ? habit.color : 'var(--theme-line)',
                                opacity: isCompleted ? 1 : 0.4,
                              }}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3">
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-sub">12 weeks ago</span>
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-sub">Today</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl border-2 border-ink border-dashed text-[11px] font-bold uppercase tracking-widest text-sub bg-bg">
          No habits yet. Start tracking something today!
        </div>
      )}
    </div>
  );
}
