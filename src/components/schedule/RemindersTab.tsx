import React, { useState } from "react";
import { useAppStore } from "../../store";
import { Plus, Trash2, Clock, AlertCircle } from "lucide-react";

export function RemindersTab() {
  const { reminders, addReminder, removeReminder } = useAppStore();
  const [rName, setRName] = useState("");
  const [rTime, setRTime] = useState("");
  const [rShowAdd, setRShowAdd] = useState(false);

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if(!rName || !rTime) return;
    addReminder({ id: crypto.randomUUID(), title: rName, time: new Date(rTime).toISOString(), triggered: false });
    setRName(""); setRTime(""); setRShowAdd(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-line p-4 md:px-6 border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2"><AlertCircle className="w-4 h-4"/> CUSTOM ALARMS</h2>
        <button onClick={() => setRShowAdd(!rShowAdd)} className="text-[11px] font-bold uppercase tracking-widest bg-ink text-bg px-4 py-2 flex items-center gap-1 hover:bg-sub rounded-xl"><Plus className="w-4 h-4"/> ADD ALARM</button>
      </div>

      {rShowAdd && (
        <form onSubmit={handleAddReminder} className="bg-highlight border-2 border-ink p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-end mb-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Reminder Title</label>
            <input required value={rName} onChange={e=>setRName(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Wake up / Check server..." />
          </div>
          <div>
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Time</label>
            <input required value={rTime} onChange={e=>setRTime(e.target.value)} type="datetime-local" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" />
          </div>
          <div>
            <button type="submit" className="w-full py-3 bg-ink text-bg text-[9px] md:text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-bg hover:text-ink border-2 border-ink transition-colors mt-2 md:mt-0">Set Alarm</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reminders.sort((a,b)=> new Date(a.time).getTime() - new Date(b.time).getTime()).map(r => (
          <div key={r.id} className="bg-bg p-4 md:p-6 border-2 border-ink rounded-2xl md:rounded-3xl relative group hover:bg-highlight hover:shadow-[3px_3px_0px_var(--theme-ink)] md:hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-[2px] transition-all overflow-hidden flex justify-between items-center">
            {r.triggered && <div className="absolute top-0 left-0 w-2 md:w-3 h-full bg-line border-r-2 border-ink" />}
            {!r.triggered && <div className="absolute top-0 left-0 w-2 md:w-3 h-full bg-ink border-r-2 border-ink" />}
            
            <div className="pl-4 md:pl-6 flex-1">
              <h4 className={`text-base md:text-lg font-bold tracking-tight mb-1 md:mb-2 pr-4 ${r.triggered ? 'text-sub line-through' : 'text-ink'}`}>{r.title}</h4>
              <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-1.5 md:gap-2"><Clock className="w-3 h-3"/> {new Date(r.time).toLocaleString()}</p>
            </div>
            <button onClick={() => removeReminder(r.id)} className="text-ink opacity-100 md:opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity p-2 shrink-0"><Trash2 className="w-5 h-5" /></button>
          </div>
        ))}
        {reminders.length === 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-sub text-center py-10 rounded-2xl col-span-1 md:col-span-2 border-2 border-ink border-dashed">No alarms set.</p>}
      </div>
    </div>
  );
}
