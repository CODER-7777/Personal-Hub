import React, { useState } from "react";
import { useAppStore } from "../../store";
import { Plus, Trash2 } from "lucide-react";

export function TasksTab() {
  const { tasks, addTask, toggleTask, removeTask } = useAppStore();
  const [tName, setTName] = useState("");
  const [tDue, setTDue] = useState("");
  const [tPriority, setTPriority] = useState<'low'|'medium'|'high'>('medium');
  const [tShowAdd, setTShowAdd] = useState(false);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if(!tName || !tDue) return;
    addTask({ id: crypto.randomUUID(), title: tName, completed: false, dueDate: new Date(tDue).toISOString(), priority: tPriority });
    setTName(""); setTDue(""); setTShowAdd(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-line p-4 md:px-6 md:py-4 border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink">TO-DO LIST</h2>
        <button onClick={() => setTShowAdd(!tShowAdd)} className="text-[11px] font-bold uppercase tracking-widest bg-ink text-bg px-4 py-2 flex items-center gap-1 hover:bg-sub rounded-xl"><Plus className="w-4 h-4"/> ADD TASK</button>
      </div>

      {tShowAdd && (
        <form onSubmit={handleAddTask} className="bg-highlight border-2 border-ink p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Task Title</label>
            <input required value={tName} onChange={e=>setTName(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Finish assignment..." />
          </div>
          <div>
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Due Date</label>
            <input required value={tDue} onChange={e=>setTDue(e.target.value)} type="date" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" />
          </div>
          <div>
            <button type="submit" className="w-full py-3 bg-ink text-bg text-[9px] md:text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-bg hover:text-ink border-2 border-ink transition-colors mt-2 md:mt-0">Add</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {tasks.map(t => (
          <div key={t.id} className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 p-4 md:p-6 border-2 rounded-2xl transition-colors ${t.completed ? 'bg-line border-ink opacity-60' : 'bg-bg border-ink hover:bg-highlight hover:shadow-[3px_3px_0px_var(--theme-ink)] md:hover:shadow-[4px_4px_0px_var(--theme-ink)] -translate-x-[1px] -translate-y-[1px]'}`}>
            <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto flex-1">
              <input type="checkbox" checked={t.completed} onChange={() => toggleTask(t.id)} className="w-5 h-5 md:w-6 md:h-6 shrink-0 border-2 border-ink accent-ink rounded-md cursor-pointer" />
              <div className="flex-1">
                <h4 className={`text-base md:text-lg font-bold tracking-tight ${t.completed ? 'line-through text-ink' : 'text-ink'}`}>{t.title}</h4>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub mt-1 md:mt-2">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
              </div>
            </div>
            <button onClick={() => removeTask(t.id)} className="text-sub hover:text-red-500 transition-colors p-2 self-end sm:self-auto"><Trash2 className="w-5 h-5 md:w-6 md:h-6" /></button>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub py-8 w-full border-2 border-ink border-dashed rounded-2xl">No tasks pending. You're free! 🎮</p>}
      </div>
    </div>
  );
}
