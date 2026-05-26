import React, { useState } from "react";
import { useAppStore, Goal, MonthlyGoal } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Target, Plus, Trash2, CheckCircle2, TrendingUp, Calendar as CalendarIcon } from "lucide-react";

export default function Goals() {
  const { 
    goals, addGoal, updateGoalProgress, removeGoal,
    monthlyGoals, addMonthlyGoal, updateMonthlyGoalProgress, toggleMonthlyGoalComplete, removeMonthlyGoal
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');

  // Weekly Add State
  const [showAddWeekly, setShowAddWeekly] = useState(false);
  const [title, setTitle] = useState("");
  const [targetCount, setTargetCount] = useState("");
  const [deadline, setDeadline] = useState("");

  // Monthly Add State
  const [showAddMonthly, setShowAddMonthly] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mType, setMType] = useState<'progress' | 'custom'>('custom');
  const [mTargetCount, setMTargetCount] = useState("");
  
  // Monthly filter state
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState(currentDate.getMonth());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear());

  const handleAddWeekly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetCount || !deadline) return;
    addGoal({
      id: crypto.randomUUID(),
      title,
      targetCount: parseInt(targetCount, 10),
      currentCount: 0,
      deadline: new Date(deadline).toISOString()
    });
    setTitle("");
    setTargetCount("");
    setDeadline("");
    setShowAddWeekly(false);
  };

  const handleAddMonthly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle) return;
    if (mType === 'progress' && !mTargetCount) return;
    
    addMonthlyGoal({
      id: crypto.randomUUID(),
      title: mTitle,
      month: filterMonth,
      year: filterYear,
      type: mType,
      targetCount: mType === 'progress' ? parseInt(mTargetCount, 10) : undefined,
      currentCount: mType === 'progress' ? 0 : undefined,
      completed: mType === 'custom' ? false : undefined,
    });
    setMTitle("");
    setMTargetCount("");
    setShowAddMonthly(false);
  };

  const handleIncrementWeekly = (goal: Goal) => {
    if (goal.currentCount < goal.targetCount) {
      updateGoalProgress(goal.id, goal.currentCount + 1);
    }
  };

  const handleIncrementMonthly = (goal: MonthlyGoal) => {
    if (goal.type === 'progress' && goal.currentCount !== undefined && goal.targetCount !== undefined) {
      if (goal.currentCount < goal.targetCount) {
        updateMonthlyGoalProgress(goal.id, goal.currentCount + 1);
      }
    }
  };

  // Weekly Stats
  const completedWeekly = goals.filter(g => g.currentCount >= g.targetCount).length;
  const totalWeekly = goals.length;
  const progressPercentWeekly = totalWeekly === 0 ? 0 : Math.round((completedWeekly / totalWeekly) * 100);

  // Monthly Stats
  const currentMonthlyGoals = monthlyGoals.filter(g => g.month === filterMonth && g.year === filterYear);
  const completedMonthly = currentMonthlyGoals.filter(g => {
    if (g.type === 'custom') return g.completed;
    return g.currentCount !== undefined && g.targetCount !== undefined && g.currentCount >= g.targetCount;
  }).length;
  const totalMonthly = currentMonthlyGoals.length;
  const progressPercentMonthly = totalMonthly === 0 ? 0 : Math.round((completedMonthly / totalMonthly) * 100);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink flex items-center gap-2 md:gap-3">
            <Target className="w-8 h-8 md:w-10 md:h-10 text-ink flex-shrink-0" /> GOALS
          </h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub mt-1 md:mt-2">Track short-term and long-term targets.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b-2 border-ink pb-4">
        <button 
          onClick={() => setActiveTab('weekly')}
          className={`px-6 py-3 font-extrabold uppercase tracking-widest text-xs md:text-sm rounded-xl transition-all border-2 ${activeTab === 'weekly' ? 'bg-ink text-bg border-ink shadow-[4px_4px_0px_var(--theme-ink)]' : 'bg-bg text-ink border-ink hover:bg-highlight hover:shadow-[4px_4px_0px_var(--theme-ink)] -translate-y-0.5'}`}
        >
          Weekly
        </button>
        <button 
          onClick={() => setActiveTab('monthly')}
          className={`px-6 py-3 font-extrabold uppercase tracking-widest text-xs md:text-sm rounded-xl transition-all border-2 ${activeTab === 'monthly' ? 'bg-ink text-bg border-ink shadow-[4px_4px_0px_var(--theme-ink)]' : 'bg-bg text-ink border-ink hover:bg-highlight hover:shadow-[4px_4px_0px_var(--theme-ink)] -translate-y-0.5'}`}
        >
          Monthly
        </button>
      </div>

      {/* ────────────────── WEEKLY GOALS ────────────────── */}
      {activeTab === 'weekly' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center bg-bg p-6 border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
             <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-ink flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-500" /> WEEKLY REPORT
                </h2>
                <p className="text-[12px] md:text-sm font-bold text-sub mt-1">
                  Completed {completedWeekly} out of {totalWeekly} goals this week.
                </p>
             </div>
             <div className="flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-ink shrink-0 bg-highlight shadow-[4px_4px_0px_var(--theme-ink)] ml-4">
                <span className="text-xl md:text-2xl font-extrabold tracking-tighter text-ink">{progressPercentWeekly}%</span>
             </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowAddWeekly(!showAddWeekly)}
              className="bg-ink hover:bg-sub text-bg px-6 py-3 font-bold uppercase tracking-widest text-xs transition-all flex justify-center items-center gap-2 border-2 border-transparent hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 rounded-xl w-full md:w-auto"
            >
              <Plus className="w-4 h-4" /> ADD WEEKLY GOAL
            </button>
          </div>

          <AnimatePresence>
            {showAddWeekly && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-highlight border-2 border-ink rounded-3xl p-5 md:p-8 overflow-hidden shadow-[4px_4px_0px_var(--theme-ink)]"
                onSubmit={handleAddWeekly}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Goal Title</label>
                    <input required value={title} onChange={e => setTitle(e.target.value)} type="text" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Read 3 chapters" />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Target Count</label>
                    <input required value={targetCount} onChange={e => setTargetCount(e.target.value)} type="number" min="1" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="3" />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Deadline</label>
                    <input required value={deadline} onChange={e => setDeadline(e.target.value)} type="date" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" />
                  </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                  <button type="button" onClick={() => setShowAddWeekly(false)} className="px-6 py-3 text-ink hover:bg-bg border-2 border-transparent hover:border-ink rounded-xl font-bold uppercase tracking-widest text-[11px] transition-colors text-center w-full sm:w-auto">CANCEL</button>
                  <button type="submit" className="px-6 py-3 bg-ink hover:bg-bg hover:text-ink text-bg border-2 border-ink rounded-xl font-bold uppercase tracking-widest text-[11px] transition-colors text-center w-full sm:w-auto">SAVE GOAL</button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {goals.map((goal, i) => {
              const isComplete = goal.currentCount >= goal.targetCount;
              const percent = Math.min((goal.currentCount / goal.targetCount) * 100, 100);
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={goal.id}
                  className={`bg-bg p-6 flex flex-col relative border-2 border-ink rounded-3xl transition-all shadow-[4px_4px_0px_var(--theme-ink)] ${isComplete ? 'opacity-80 bg-line' : 'hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--theme-ink)]'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className={`font-extrabold text-xl md:text-2xl tracking-tight leading-none ${isComplete ? 'line-through text-sub' : 'text-ink'}`}>
                        {goal.title}
                      </h3>
                      {isComplete && <CheckCircle2 className="w-5 h-5 text-[var(--color-safe-green)]" />}
                    </div>
                    <button onClick={() => removeGoal(goal.id)} className="text-sub hover:text-red-500 transition-colors p-1 shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sub">
                      Progress: {goal.currentCount} / {goal.targetCount}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-sub">
                      Due: {new Date(goal.deadline).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="h-4 w-full bg-line rounded-full border-2 border-ink overflow-hidden mb-4">
                    <motion.div 
                      className={`h-full border-r-2 border-ink ${isComplete ? 'bg-[var(--color-safe-green)]' : 'bg-highlight'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>

                  {!isComplete && (
                    <button
                      onClick={() => handleIncrementWeekly(goal)}
                      className="mt-auto py-3 bg-ink text-bg border-2 border-ink hover:bg-bg hover:text-ink rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
                    >
                      +1 PROGRESS
                    </button>
                  )}
                </motion.div>
              );
            })}
            {goals.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-3xl border-2 border-ink border-dashed text-[11px] font-bold uppercase tracking-widest text-sub bg-bg">
                No active weekly goals. Set one to stay focused!
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ────────────────── MONTHLY GOALS ────────────────── */}
      {activeTab === 'monthly' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center bg-bg p-6 border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)] gap-4">
             <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-ink flex items-center gap-2">
                  <CalendarIcon className="w-6 h-6 text-ink" /> MONTHLY REPORT
                </h2>
                <p className="text-[12px] md:text-sm font-bold text-sub mt-1">
                  Completed {completedMonthly} out of {totalMonthly} goals for {months[filterMonth]} {filterYear}.
                </p>
             </div>
             
             <div className="flex items-center gap-4">
               <div className="flex gap-2">
                 <select value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} className="px-4 py-2 border-2 border-ink rounded-xl bg-bg text-sm font-bold focus:outline-none">
                   {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                 </select>
                 <select value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} className="px-4 py-2 border-2 border-ink rounded-xl bg-bg text-sm font-bold focus:outline-none">
                   {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                 </select>
               </div>
               
               <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 border-ink shrink-0 bg-highlight shadow-[2px_2px_0px_var(--theme-ink)]">
                  <span className="text-lg font-extrabold tracking-tighter text-ink">{progressPercentMonthly}%</span>
               </div>
             </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowAddMonthly(!showAddMonthly)}
              className="bg-ink hover:bg-sub text-bg px-6 py-3 font-bold uppercase tracking-widest text-xs transition-all flex justify-center items-center gap-2 border-2 border-transparent hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 rounded-xl w-full md:w-auto"
            >
              <Plus className="w-4 h-4" /> ADD MONTHLY GOAL
            </button>
          </div>

          <AnimatePresence>
            {showAddMonthly && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-highlight border-2 border-ink rounded-3xl p-5 md:p-8 overflow-hidden shadow-[4px_4px_0px_var(--theme-ink)]"
                onSubmit={handleAddMonthly}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Goal Title</label>
                    <input required value={mTitle} onChange={e => setMTitle(e.target.value)} type="text" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Learn React Native" />
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Goal Type</label>
                    <select value={mType} onChange={(e) => setMType(e.target.value as any)} className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink">
                      <option value="custom">Custom (Checkbox)</option>
                      <option value="progress">Progress (Target Count)</option>
                    </select>
                  </div>
                  {mType === 'progress' && (
                    <div>
                      <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Target Count</label>
                      <input required value={mTargetCount} onChange={e => setMTargetCount(e.target.value)} type="number" min="1" className="w-full px-4 py-3 border-2 border-ink rounded-xl text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="10" />
                    </div>
                  )}
                </div>
                
                <p className="text-xs font-bold text-sub mb-6">This goal will be added to: <span className="text-ink">{months[filterMonth]} {filterYear}</span></p>

                <div className="mt-4 flex flex-col sm:flex-row justify-end gap-3">
                  <button type="button" onClick={() => setShowAddMonthly(false)} className="px-6 py-3 text-ink hover:bg-bg border-2 border-transparent hover:border-ink rounded-xl font-bold uppercase tracking-widest text-[11px] transition-colors text-center w-full sm:w-auto">CANCEL</button>
                  <button type="submit" className="px-6 py-3 bg-ink hover:bg-bg hover:text-ink text-bg border-2 border-ink rounded-xl font-bold uppercase tracking-widest text-[11px] transition-colors text-center w-full sm:w-auto">SAVE GOAL</button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {currentMonthlyGoals.map((goal, i) => {
              const isComplete = goal.type === 'custom' ? goal.completed : (goal.currentCount !== undefined && goal.targetCount !== undefined && goal.currentCount >= goal.targetCount);
              const percent = goal.type === 'progress' && goal.currentCount !== undefined && goal.targetCount !== undefined ? Math.min((goal.currentCount / goal.targetCount) * 100, 100) : (isComplete ? 100 : 0);
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={goal.id}
                  className={`bg-bg p-6 flex flex-col relative border-2 border-ink rounded-3xl transition-all shadow-[4px_4px_0px_var(--theme-ink)] ${isComplete ? 'opacity-80 bg-line' : 'hover:-translate-y-1 hover:shadow-[6px_6px_0px_var(--theme-ink)]'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                      {goal.type === 'custom' && (
                        <input 
                          type="checkbox" 
                          checked={goal.completed} 
                          onChange={() => toggleMonthlyGoalComplete(goal.id)}
                          className="w-6 h-6 shrink-0 border-2 border-ink accent-ink rounded-md cursor-pointer mt-1" 
                        />
                      )}
                      <div>
                        <h3 className={`font-extrabold text-xl md:text-2xl tracking-tight leading-none ${isComplete ? 'line-through text-sub' : 'text-ink'}`}>
                          {goal.title}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sub bg-line px-2 py-0.5 rounded-md border-2 border-ink mt-2 inline-block">
                          {goal.type === 'custom' ? 'Custom Goal' : 'Progress Goal'}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => removeMonthlyGoal(goal.id)} className="text-sub hover:text-red-500 transition-colors p-1 shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {goal.type === 'progress' && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sub">
                          Progress: {goal.currentCount} / {goal.targetCount}
                        </span>
                      </div>

                      <div className="h-4 w-full bg-line rounded-full border-2 border-ink overflow-hidden mb-4">
                        <motion.div 
                          className={`h-full border-r-2 border-ink ${isComplete ? 'bg-[var(--color-safe-green)]' : 'bg-highlight'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>

                      {!isComplete && (
                        <button
                          onClick={() => handleIncrementMonthly(goal)}
                          className="mt-auto py-3 bg-ink text-bg border-2 border-ink hover:bg-bg hover:text-ink rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
                        >
                          +1 PROGRESS
                        </button>
                      )}
                    </>
                  )}
                </motion.div>
              );
            })}
            {currentMonthlyGoals.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-3xl border-2 border-ink border-dashed text-[11px] font-bold uppercase tracking-widest text-sub bg-bg">
                No goals set for {months[filterMonth]} {filterYear}.
              </div>
            )}
          </div>
        </motion.div>
      )}

    </div>
  );
}
