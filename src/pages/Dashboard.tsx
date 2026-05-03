import { useAppStore } from "../store";
import { motion } from "motion/react";
import { Wallet, Clock, Trophy, BookOpen } from "lucide-react";

export default function Dashboard() {
  const { classes, expenses, tasks } = useAppStore();

  const today = new Date().getDay();
  const todayClasses = classes.filter(c => c.dayOfWeek === today).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 3);
  
  const totalExpenses = expenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6 md:space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter leading-none text-ink mb-1 md:mb-2">HELLO!</h1>
        <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Here's your overview for today.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 py-2 md:py-4">
        {[
          { title: "Today's Classes", value: todayClasses.length.toString(), icon: Clock },
          { title: "Pending Tasks", value: pendingTasks.length.toString(), icon: BookOpen },
          { title: "Total Expenses", value: `$${totalExpenses.toFixed(0)}`, icon: Wallet },
          { title: "Contests Tracked", value: "CF", icon: Trophy }
        ].map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-bg p-4 md:p-6 flex flex-col justify-center items-start gap-3 md:gap-4 border-2 border-ink rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_var(--theme-ink)] md:hover:shadow-[2px_2px_0px_var(--theme-ink)] hover:bg-highlight transition-all group"
          >
            <div className="p-2 md:p-3 border-2 border-ink rounded-lg md:rounded-xl bg-bg group-hover:bg-bg transition-colors">
              <stat.icon className="w-4 h-4 md:w-6 md:h-6 text-ink" />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub group-hover:text-ink">{stat.title}</p>
              <h3 className="text-2xl md:text-4xl font-extrabold tracking-tighter mt-1 text-ink">{stat.value}</h3>
            </div>
          </motion.div>
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
    </div>
  );
}
