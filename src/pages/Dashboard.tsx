import { useAppStore } from "../store";
import { motion } from "motion/react";
import { Wallet, Clock, Trophy, BookOpen, Brain, Flame, StickyNote, Target } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Dashboard() {
  const { classes, expenses, tasks, pomodoroSessions, habits, notes } = useAppStore();

  const today = new Date().getDay();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayClasses = classes.filter(c => c.dayOfWeek === today).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);
  
  const totalExpenses = expenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  // Focus stats
  const todayFocus = pomodoroSessions
    .filter(s => s.date === todayStr && s.type === 'focus')
    .reduce((sum, s) => sum + s.duration, 0);

  // Habits completed today
  const habitsCompletedToday = habits.filter(h => h.completions.includes(todayStr)).length;

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "GOOD MORNING!" : hour < 17 ? "GOOD AFTERNOON!" : "GOOD EVENING!";

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter leading-none text-ink mb-1 md:mb-2">{greeting}</h1>
        <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Here's your overview for today.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 py-2 md:py-4">
        {[
          { title: "Today's Classes", value: todayClasses.length.toString(), icon: Clock, path: "/schedule" },
          { title: "Focus Today", value: `${todayFocus}m`, icon: Brain, path: "/focus" },
          { title: "Habits Done", value: `${habitsCompletedToday}/${habits.length}`, icon: Target, path: "/habits" },
          { title: "Quick Notes", value: notes.length.toString(), icon: StickyNote, path: "/notes" },
        ].map((stat, i) => (
          <NavLink key={stat.title} to={stat.path}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-bg p-4 md:p-6 flex flex-col justify-center items-start gap-3 md:gap-4 border-2 border-ink rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_var(--theme-ink)] md:hover:shadow-[2px_2px_0px_var(--theme-ink)] hover:bg-highlight transition-all group cursor-pointer"
            >
              <div className="p-2 md:p-3 border-2 border-ink rounded-lg md:rounded-xl bg-bg group-hover:bg-bg transition-colors">
                <stat.icon className="w-4 h-4 md:w-6 md:h-6 text-ink" />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub group-hover:text-ink">{stat.title}</p>
                <h3 className="text-2xl md:text-4xl font-extrabold tracking-tighter mt-1 text-ink">{stat.value}</h3>
              </div>
            </motion.div>
          </NavLink>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-4 md:mt-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-bg p-5 md:p-8 border-2 border-ink rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)]">
          <h2 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub mb-4 md:mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ink" /> TODAY'S SCHEDULE
          </h2>
          {todayClasses.length > 0 ? (
            <div className="space-y-4">
              {todayClasses.map(c => (
                <div key={c.id} className="border-2 border-ink rounded-xl md:rounded-2xl p-3 md:p-4 hover:bg-highlight transition-colors relative">
                  <div className="text-[10px] md:text-[11px] font-extrabold border-2 border-ink px-2 py-1 inline-block mb-2 md:mb-3 bg-bg rounded-lg">
                    {c.startTime} — {c.endTime}
                  </div>
                  <h4 className="text-xl md:text-2xl font-bold tracking-tight text-ink leading-none">{c.className}</h4>
                  <p className="text-[10px] md:text-xs font-bold uppercase mt-1 md:mt-2 text-ink">{c.type} {c.room && `• ${c.room}`}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] font-bold uppercase text-sub py-4">No classes today! 🎉</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-bg p-5 md:p-8 border-2 border-ink rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)]">
          <h2 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub mb-4 md:mb-6 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-ink" /> UPCOMING TASKS
          </h2>
          {pendingTasks.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {pendingTasks.map(t => (
                <div key={t.id} className="flex justify-between items-start p-3 md:p-4 border-2 border-ink rounded-xl md:rounded-2xl group hover:bg-highlight transition-colors relative">
                  <div className="flex items-start gap-2 md:gap-3">
                    <div className={`w-2 h-2 md:w-3 md:h-3 border-2 border-ink mt-1 flex-shrink-0 rounded-full ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-highlight' : 'bg-green-400'}`} />
                    <h4 className="text-base md:text-lg font-bold tracking-tight text-ink leading-tight">{t.title}</h4>
                  </div>
                  <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub group-hover:text-ink whitespace-nowrap ml-2 md:ml-4">
                    {new Date(t.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] md:text-[11px] font-bold uppercase text-sub py-4">All caught up! ✨</p>
          )}
        </motion.div>
      </div>

      {/* Habit Streaks Quick View */}
      {habits.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <NavLink to="/habits">
            <div className="bg-bg p-5 md:p-8 border-2 border-ink rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] hover:bg-highlight transition-colors group">
              <h2 className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub mb-4 md:mb-6 flex items-center gap-2">
                <Flame className="w-4 h-4 text-ink" /> HABIT STREAKS
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {habits.map(h => {
                  const completedToday = h.completions.includes(todayStr);
                  return (
                    <div
                      key={h.id}
                      className={`flex items-center gap-3 p-3 md:p-4 rounded-xl border-2 transition-colors ${
                        completedToday
                          ? 'border-ink bg-line'
                          : 'border-ink border-dashed'
                      }`}
                    >
                      <span className="text-xl md:text-2xl">{h.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold tracking-tight text-ink truncate">{h.name}</h4>
                        <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-sub">
                          {completedToday ? '✓ Done' : 'Not yet'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </NavLink>
        </motion.div>
      )}
    </div>
  );
}
