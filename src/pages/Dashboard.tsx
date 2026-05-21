import { useAppStore } from "../store";
import { motion } from "motion/react";
import { Wallet, Clock, BookOpen, StickyNote, PieChart, AlertTriangle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { differenceInDays, parseISO } from "date-fns";

export default function Dashboard() {
  const { classes, expenses, tasks, notes } = useAppStore();

  const today = new Date().getDay();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayClasses = classes.filter(c => c.dayOfWeek === today).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const pendingTasks = tasks.filter(t => !t.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
  
  const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  // Overdue tasks count
  const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;

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
          { title: "Pending Tasks", value: pendingTasks.length.toString(), icon: BookOpen, path: "/schedule" },
          { title: "Documents", value: notes.length.toString(), icon: StickyNote, path: "/notes" },
          { title: "Balance", value: `$${balance.toFixed(0)}`, icon: PieChart, path: "/finances" },
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

      {/* Overdue Warning Banner */}
      {overdueTasks > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <NavLink to="/schedule">
            <div className="bg-[var(--color-safe-red-bg)] border-2 border-[var(--color-safe-red)] rounded-2xl p-4 md:p-6 flex items-center gap-4 hover:shadow-[4px_4px_0px_var(--color-safe-red)] transition-all cursor-pointer">
              <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-[var(--color-safe-red)] flex-shrink-0" />
              <div>
                <h3 className="text-lg md:text-xl font-extrabold text-[var(--color-safe-red)] tracking-tight">
                  {overdueTasks} OVERDUE TASK{overdueTasks > 1 ? 'S' : ''}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-safe-red)] opacity-80">
                  You have tasks past their due date. Tap to review.
                </p>
              </div>
            </div>
          </NavLink>
        </motion.div>
      )}

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
                  <h4 className="text-xl md:text-2xl font-bold tracking-tight text-ink leading-tight break-words">{c.className}</h4>
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
              {pendingTasks.map(t => {
                const daysUntilDue = differenceInDays(parseISO(t.dueDate), new Date());
                const isOverdue = daysUntilDue < 0;
                return (
                  <div key={t.id} className={`flex justify-between items-start p-3 md:p-4 border-2 rounded-xl md:rounded-2xl group hover:bg-highlight transition-colors relative ${isOverdue ? 'border-[var(--color-safe-red)] bg-[var(--color-safe-red-bg)]' : 'border-ink'}`}>
                    <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 md:w-3 md:h-3 border-2 border-ink mt-1 flex-shrink-0 rounded-full ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-highlight' : 'bg-green-400'}`} />
                      <h4 className="text-base md:text-lg font-bold tracking-tight text-ink leading-tight break-words">{t.title}</h4>
                    </div>
                    <div className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ml-2 md:ml-4 ${isOverdue ? 'text-[var(--color-safe-red)]' : 'text-sub group-hover:text-ink'}`}>
                      {isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : daysUntilDue === 0 ? 'Today' : `${daysUntilDue}d left`}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] md:text-[11px] font-bold uppercase text-sub py-4">All caught up! ✨</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
