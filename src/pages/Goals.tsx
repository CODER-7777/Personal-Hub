import React, { useState } from "react";
import { useAppStore, Goal } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { Target, Plus, Trash2, CheckCircle2, TrendingUp } from "lucide-react";

export default function Goals() {
  const { goals, addGoal, updateGoalProgress, removeGoal } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [targetCount, setTargetCount] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleAdd = (e: React.FormEvent) => {
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
    setShowAdd(false);
  };

  const handleIncrement = (goal: Goal) => {
    if (goal.currentCount < goal.targetCount) {
      updateGoalProgress(goal.id, goal.currentCount + 1);
    }
  };

  const completedGoals = goals.filter(g => g.currentCount >= g.targetCount).length;
  const totalGoals = goals.length;
  const progressPercent = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink flex items-center gap-2 md:gap-3">
            <Target className="w-8 h-8 md:w-10 md:h-10 text-ink flex-shrink-0" /> WEEKLY GOALS
          </h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub mt-1 md:mt-2">Track progress and hit your targets.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-ink hover:bg-sub text-bg px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex justify-center items-center gap-2 border-2 border-transparent hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 rounded-xl w-full md:w-auto mt-2 md:mt-0"
        >
          <Plus className="w-4 h-4" /> ADD GOAL
        </button>
      </div>

      {/* Weekly Report Summary */}
      <div className="bg-bg p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
        <div className="flex-1 space-y-2">
          <h2 className="text-xl md:text-2xl font-extrabold uppercase tracking-tight text-ink flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-500" /> WEEKLY REPORT
          </h2>
          <p className="text-[12px] md:text-sm font-bold text-sub">
            You have completed {completedGoals} out of {totalGoals} goals this week.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-ink shrink-0 bg-highlight shadow-[4px_4px_0px_var(--theme-ink)]">
          <span className="text-2xl md:text-3xl font-extrabold tracking-tighter text-ink">{progressPercent}%</span>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-highlight border-2 border-ink rounded-3xl p-5 md:p-8 overflow-hidden shadow-[4px_4px_0px_var(--theme-ink)]"
            onSubmit={handleAdd}
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
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-3 text-ink hover:bg-bg border-2 border-transparent hover:border-ink rounded-xl font-bold uppercase tracking-widest text-[11px] transition-colors text-center w-full sm:w-auto">CANCEL</button>
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
                  onClick={() => handleIncrement(goal)}
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
            No active goals. Set one to stay focused!
          </div>
        )}
      </div>
    </div>
  );
}
