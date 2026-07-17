import { useAppStore } from "../store";
import { motion } from "motion/react";
import { Wallet, Clock, BookOpen, StickyNote, PieChart as PieChartIcon, AlertTriangle, TrendingUp, Flame, Search, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { NavLink } from "react-router-dom";
import { differenceInDays, parseISO, format, subDays, isSameDay, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

// ─── HELPER: Generate monthly spending data for the mini chart ───
function useMonthlyTrend(expenses: any[]) {
  const months: { name: string; expense: number; income: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const monthExpenses = expenses.filter(e => {
      const ed = new Date(e.date);
      return e.type === 'expense' && ed >= start && ed <= end;
    }).reduce((s, e) => s + e.amount, 0);
    const monthIncome = expenses.filter(e => {
      const ed = new Date(e.date);
      return e.type === 'income' && ed >= start && ed <= end;
    }).reduce((s, e) => s + e.amount, 0);
    months.push({ name: format(d, "MMM"), expense: monthExpenses, income: monthIncome });
  }
  return months;
}

export default function Dashboard() {
  const { classes, expenses, tasks, notes, habits, goals, profileName } = useAppStore();

  const today = new Date();
  const todayDayOfWeek = today.getDay();
  const todayClasses = classes.filter(c => c.dayOfWeek === todayDayOfWeek).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const pendingTasks = tasks.filter(t => !t.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < today);

  const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;

  const monthlyData = useMonthlyTrend(expenses);

  const hour = today.getHours();
  const greeting = hour < 12 ? "Good Morning!" : hour < 17 ? "Good Afternoon!" : "Good Evening!";

  // Habit streak calculation (reused from Habits page)
  const getStreak = (habit: any) => {
    if (!habit.completions || habit.completions.length === 0) return 0;
    let streak = 0;
    const todayStr = format(today, "yyyy-MM-dd");
    const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
    if (!habit.completions.includes(todayStr) && !habit.completions.includes(yesterdayStr)) return 0;
    let checkDate = habit.completions.includes(todayStr) ? today : subDays(today, 1);
    while (habit.completions.includes(format(checkDate, "yyyy-MM-dd"))) {
      streak++;
      checkDate = subDays(checkDate, 1);
    }
    return streak;
  };

  // Pie chart data for finances
  const pieData = [
    { name: "Income", value: totalIncome || 1, color: "#22c55e" },
    { name: "Expense", value: totalExpense || 1, color: "#ef4444" },
  ];
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // ─── STAT CARD CONFIG (gradient colors matching reference screenshots) ───
  const statCards = [
    { title: "Today's Classes", value: todayClasses.length.toString(), icon: Clock, path: "/schedule", gradient: "from-teal-500/20 to-teal-600/5", border: "border-teal-500/30", iconBg: "bg-teal-500/20", iconColor: "text-teal-400" },
    { title: "Pending Tasks", value: pendingTasks.length.toString(), icon: BookOpen, path: "/schedule", gradient: "from-orange-500/20 to-orange-600/5", border: "border-orange-500/30", iconBg: "bg-orange-500/20", iconColor: "text-orange-400" },
    { title: "Documents", value: notes.length.toString(), icon: StickyNote, path: "/notes", gradient: "from-purple-500/20 to-purple-600/5", border: "border-purple-500/30", iconBg: "bg-purple-500/20", iconColor: "text-purple-400" },
    { title: "Balance", value: `₹${balance.toFixed(0)}`, icon: Wallet, path: "/finances", gradient: "from-emerald-500/20 to-emerald-600/5", border: "border-emerald-500/30", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-5 md:space-y-6">
      {/* ─── HEADER ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter leading-none text-ink">{greeting}</h1>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-sub mt-1">
            Welcome {profileName}. Here's your overview for today.
          </p>
        </div>
        {/* Desktop search bar */}
        <div className="hidden md:flex items-center gap-2 bg-line border-2 border-ink/20 rounded-xl px-4 py-2.5 hover:border-ink/40 transition-colors w-72">
          <Search className="w-4 h-4 text-sub" />
          <span className="text-xs font-bold text-sub uppercase tracking-widest">Search</span>
          <ChevronRight className="w-3 h-3 text-sub ml-auto" />
        </div>
      </motion.div>

      {/* ─── STAT CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((stat, i) => (
          <NavLink key={stat.title} to={stat.path}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} backdrop-blur-sm p-4 md:p-5 flex flex-col justify-between gap-3 border-2 ${stat.border} rounded-2xl md:rounded-3xl hover:-translate-y-1 hover:shadow-lg transition-all group cursor-pointer min-h-[100px] md:min-h-[120px]`}
            >
              <div className={`p-2 md:p-2.5 ${stat.iconBg} rounded-xl w-fit`}>
                <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub">{stat.title}</p>
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter text-ink">{stat.value}</h3>
              </div>
            </motion.div>
          </NavLink>
        ))}
      </div>

      {/* ─── OVERDUE WARNING ─── */}
      {overdueTasks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <NavLink to="/schedule">
            <div className="bg-[var(--color-safe-red-bg)] border-2 border-[var(--color-safe-red)] rounded-2xl p-4 flex items-center gap-4 hover:shadow-[4px_4px_0px_var(--color-safe-red)] transition-all cursor-pointer">
              <AlertTriangle className="w-6 h-6 text-[var(--color-safe-red)] flex-shrink-0" />
              <div>
                <h3 className="text-sm md:text-base font-extrabold text-[var(--color-safe-red)] tracking-tight">
                  {overdueTasks.length} OVERDUE TASK{overdueTasks.length > 1 ? 'S' : ''}
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-safe-red)] opacity-80">Tap to review.</p>
              </div>
            </div>
          </NavLink>
        </motion.div>
      )}

      {/* ─── MAIN GRID (Desktop: 2-col, Mobile: stacked) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5">

        {/* ─── FINANCES PANEL (Desktop: 3-col span) ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="lg:col-span-3 bg-bg border-2 border-ink/20 rounded-2xl md:rounded-3xl p-5 md:p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sub flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-ink" /> Finances
            </h2>
            <NavLink to="/finances" className="text-[10px] font-bold uppercase tracking-widest text-sub hover:text-ink transition-colors flex items-center gap-1">
              See All <ChevronRight className="w-3 h-3" />
            </NavLink>
          </div>

          {/* Desktop: side-by-side pie + line chart. Mobile: just summary numbers */}
          <div className="hidden md:grid md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-ink">{savingsRate}%</span>
                  <span className="text-[9px] font-bold text-sub uppercase tracking-widest">Saved</span>
                </div>
              </div>
              <div className="flex gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-[9px] font-bold text-sub uppercase">Income</p>
                    <p className="text-sm font-extrabold text-ink">₹{totalIncome.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-[9px] font-bold text-sub uppercase">Expense</p>
                    <p className="text-sm font-extrabold text-ink">₹{totalExpense.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Area Chart — Monthly Trend */}
            <div>
              <p className="text-[10px] font-bold text-sub uppercase tracking-widest mb-3">Spending Trend</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--theme-sub)' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: 'var(--theme-bg)', border: '2px solid var(--theme-ink)', borderRadius: 12, fontSize: 11, fontWeight: 700 }} />
                  <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mobile: simple summary */}
          <div className="md:hidden grid grid-cols-3 gap-3">
            <div className="bg-line rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold text-sub uppercase">Income</p>
              <p className="text-base font-extrabold text-emerald-500">₹{totalIncome.toLocaleString()}</p>
            </div>
            <div className="bg-line rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold text-sub uppercase">Expense</p>
              <p className="text-base font-extrabold text-red-500">₹{totalExpense.toLocaleString()}</p>
            </div>
            <div className="bg-line rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold text-sub uppercase">Balance</p>
              <p className="text-base font-extrabold text-ink">₹{balance.toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* ─── UPCOMING TASKS PANEL (Desktop: 2-col span) ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-bg border-2 border-ink/20 rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sub flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-ink" /> Upcoming Tasks
            </h2>
            <NavLink to="/schedule" className="text-[10px] font-bold uppercase tracking-widest text-sub hover:text-ink transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </NavLink>
          </div>
          {overdueTasks.length > 0 && (
            <div className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-safe-red)] mb-3">
              Overdue Task → {overdueTasks.length} overdue
            </div>
          )}
          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[320px]">
            {pendingTasks.length > 0 ? pendingTasks.slice(0, 8).map(t => {
              const daysUntilDue = differenceInDays(parseISO(t.dueDate), today);
              const isOverdue = daysUntilDue < 0;
              return (
                <div key={t.id} className={`flex items-start justify-between p-3 rounded-xl border-2 transition-colors hover:bg-line/50 ${isOverdue ? 'border-[var(--color-safe-red)]/50 bg-[var(--color-safe-red-bg)]' : 'border-ink/10'}`}>
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-ink leading-tight truncate">{t.title}</h4>
                      <p className="text-[9px] font-bold text-sub uppercase tracking-widest mt-0.5">
                        Due {format(parseISO(t.dueDate), "MMM d")}
                      </p>
                    </div>
                  </div>
                  {isOverdue && (
                    <span className="text-[8px] font-extrabold uppercase tracking-widest bg-[var(--color-safe-red)] text-white px-2 py-0.5 rounded-md whitespace-nowrap ml-2">
                      {Math.abs(daysUntilDue)}D Overdue
                    </span>
                  )}
                </div>
              );
            }) : (
              <p className="text-[10px] font-bold uppercase text-sub py-4 text-center">All caught up! ✨</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── BOTTOM ROW: Schedule + Habits ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {/* ─── TODAY'S SCHEDULE ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="bg-bg border-2 border-ink/20 rounded-2xl md:rounded-3xl p-5 md:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sub flex items-center gap-2">
              <Clock className="w-4 h-4 text-ink" /> Today's Schedule
            </h2>
            <NavLink to="/schedule" className="text-[10px] font-bold uppercase tracking-widest text-sub hover:text-ink transition-colors flex items-center gap-1">
              See All <ChevronRight className="w-3 h-3" />
            </NavLink>
          </div>

          {todayClasses.length > 0 ? (
            <div className="space-y-3">
              {todayClasses.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-ink/10 hover:bg-line/50 transition-colors">
                  <div className="bg-gradient-to-br from-teal-500/20 to-teal-600/5 border border-teal-500/30 rounded-lg px-2.5 py-1.5 text-center min-w-[70px]">
                    <p className="text-[10px] font-extrabold text-teal-500">{c.startTime}</p>
                    <p className="text-[8px] font-bold text-sub">{c.endTime}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-ink truncate">{c.className}</h4>
                    <p className="text-[9px] font-bold text-sub uppercase tracking-widest">{c.type} {c.room && `• ${c.room}`}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] font-bold uppercase text-sub py-6 text-center">No classes today! 🎉</p>
          )}
        </motion.div>

        {/* ─── HABITS SUMMARY (Desktop only with full grid, mobile compact) ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="bg-bg border-2 border-ink/20 rounded-2xl md:rounded-3xl p-5 md:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-sub flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Habits
            </h2>
            <NavLink to="/habits" className="text-[10px] font-bold uppercase tracking-widest text-sub hover:text-ink transition-colors flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </NavLink>
          </div>

          {habits.length > 0 ? (
            <div className="space-y-3">
              {habits.slice(0, 5).map(habit => {
                const streak = getStreak(habit);
                const todayDone = habit.completions?.includes(format(today, "yyyy-MM-dd"));
                return (
                  <div key={habit.id} className="flex items-center justify-between p-3 rounded-xl border-2 border-ink/10 hover:bg-line/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xl">{habit.icon}</span>
                      <span className="text-sm font-bold text-ink truncate">{habit.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {todayDone && (
                        <span className="text-[8px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-md">Done</span>
                      )}
                      <div className="text-right">
                        <span className="text-base font-extrabold text-orange-500">{streak}</span>
                        <Flame className="w-3 h-3 text-orange-500 inline-block ml-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] font-bold uppercase text-sub py-6 text-center">No habits tracked yet. Start building streaks! 🔥</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
