import React, { useState } from "react";
import { useAppStore } from "../../store";
import { Plus, Trash2 } from "lucide-react";
import { GoogleCalendarSync } from "./GoogleCalendarSync";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ClassesTab() {
  const { classes, addClasses, removeClass } = useAppStore();
  const [cName, setCName] = useState("");
  const [cDay, setCDay] = useState("1");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const [cRoom, setCRoom] = useState("");
  const [cShowAdd, setCShowAdd] = useState(false);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if(!cName || !cStart || !cEnd) return;
    addClasses([{ id: crypto.randomUUID(), className: cName, dayOfWeek: parseInt(cDay), startTime: cStart, endTime: cEnd, room: cRoom, type: 'Class' }]);
    setCName(""); setCStart(""); setCEnd(""); setCRoom(""); setCShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-line p-4 md:px-6 md:py-4 border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink">YOUR WEEKLY SCHEDULE</h2>
        <button onClick={() => setCShowAdd(!cShowAdd)} className="text-[11px] font-bold uppercase tracking-widest bg-ink text-bg px-4 py-2 flex items-center gap-1 hover:bg-sub rounded-xl"><Plus className="w-4 h-4"/> ADD MANUAL</button>
      </div>

      <GoogleCalendarSync />
      
      {cShowAdd && (
        <form onSubmit={handleAddClass} className="bg-highlight border-2 border-ink p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Class Name</label>
            <input required value={cName} onChange={e=>setCName(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Physics 101" />
          </div>
          <div>
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Day</label>
            <select value={cDay} onChange={e=>setCDay(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Start</label>
              <input required value={cStart} onChange={e=>setCStart(e.target.value)} type="time" className="w-full px-2 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">End</label>
              <input required value={cEnd} onChange={e=>setCEnd(e.target.value)} type="time" className="w-full px-2 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" />
            </div>
          </div>
          <div>
            <button type="submit" className="w-full py-3 bg-ink text-bg text-[9px] md:text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-bg hover:text-ink border-2 border-ink transition-colors mt-2 md:mt-0">Save</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((dayIndex) => { // Monday to Friday usually
          const dayClasses = classes.filter(c => c.dayOfWeek === dayIndex).sort((a,b) => a.startTime.localeCompare(b.startTime));
          return (
            <div key={dayIndex} className="bg-line p-4 md:p-6 flex flex-col border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
              <h3 className="font-bold text-ink text-center pb-3 border-b-2 border-ink mb-4 uppercase tracking-widest text-[11px]">
                {DAYS[dayIndex]}
              </h3>
              {dayClasses.length > 0 ? (
                <div className="space-y-4 flex-1">
                  {dayClasses.map(c => (
                    <div key={c.id} className="bg-bg p-4 rounded-2xl border-2 border-ink relative group text-sm hover:bg-highlight transition-colors hover:shadow-[4px_4px_0px_var(--theme-ink)] -translate-x-[2px] -translate-y-[2px]">
                      <button onClick={()=>removeClass(c.id)} className="absolute top-2 right-2 p-1 text-sub opacity-0 group-hover:opacity-100 hover:text-red-600 bg-bg rounded-md border-2 border-transparent group-hover:border-ink transition-all"><Trash2 className="w-4 h-4" /></button>
                      <div className="text-ink font-bold text-[10px] uppercase tracking-widest border-2 border-ink bg-bg px-2 py-1 inline-block mb-3 rounded-lg">
                        {c.startTime} — {c.endTime}
                      </div>
                      <h4 className="font-bold text-ink pr-4 text-lg tracking-tight leading-tight mb-2 break-words">{c.className}</h4>
                      {c.room && <div className="text-[10px] font-bold uppercase text-sub group-hover:text-ink">Room: {c.room}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sub text-[10px] font-bold uppercase tracking-widest py-4">No classes</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
