import React, { useState } from "react";
import { ClassSession, useAppStore } from "../../store";
import { Plus, Trash2, Pencil } from "lucide-react";

import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ClassesTab() {
  const { classes, addClasses, removeClass, updateClass } = useAppStore();
  const [cName, setCName] = useState("");
  const [cDay, setCDay] = useState("1");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const [cRoom, setCRoom] = useState("");
  const [cShowAdd, setCShowAdd] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const closeForm = () => {
    setCShowAdd(false); setEditingId(null); setCName(""); setCStart(""); setCEnd(""); setCRoom("");
  };
  const editClass = (session: ClassSession) => {
    setEditingId(session.id); setCName(session.className); setCDay(String(session.dayOfWeek));
    setCStart(session.startTime); setCEnd(session.endTime); setCRoom(session.room || ""); setCShowAdd(true);
    requestAnimationFrame(() => document.getElementById('schedule-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cStart || !cEnd) return;
    if (cEnd <= cStart) { toast.error("End time must be after start time."); return; }
    if (editingId && !classes.some(c => c.id === editingId)) {
      toast.error("This entry was deleted on another device. Cancel and add a new entry if needed."); return;
    }
    const updates = { className: cName.trim(), dayOfWeek: Number(cDay), startTime: cStart, endTime: cEnd, room: cRoom.trim() };
    const overlaps = classes.some(c => c.id !== editingId && c.dayOfWeek === Number(cDay) && cStart < c.endTime && cEnd > c.startTime);
    if (editingId) updateClass(editingId, updates);
    else addClasses([{ id: crypto.randomUUID(), ...updates, type: 'Class' }]);
    toast.success(editingId ? "Schedule entry updated." : "Schedule entry added.");
    if (overlaps) toast.warning("This entry overlaps another class. Check your timetable.");
    closeForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 justify-between items-center bg-line p-4 md:px-6 md:py-4 border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink">YOUR WEEKLY SCHEDULE</h2>
        <button aria-expanded={cShowAdd} aria-controls="schedule-editor" onClick={() => { closeForm(); setCShowAdd(true); }} className="text-[11px] font-bold uppercase tracking-widest bg-ink text-bg px-4 py-2 flex items-center gap-1 hover:bg-sub rounded-xl"><Plus className="w-4 h-4"/> ADD MANUAL</button>
      </div>

      {cShowAdd && (
        <form id="schedule-editor" aria-label={editingId ? "Edit schedule entry" : "New schedule entry"} onSubmit={handleAddClass} className="scroll-mt-20 bg-highlight border-2 border-ink p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-[3px_3px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="class-name" className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Class Name</label>
            <input id="class-name" maxLength={120} required value={cName} onChange={e=>setCName(e.target.value)} type="text" className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" placeholder="Physics 101" />
          </div>
          <div>
            <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Day</label>
            <select id="class-day" aria-label="Day" value={cDay} onChange={e=>setCDay(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">Start</label>
              <input id="class-start" aria-label="Start time" required value={cStart} onChange={e=>setCStart(e.target.value)} type="time" className="w-full px-2 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-ink mb-1 md:mb-2">End</label>
              <input id="class-end" aria-label="End time" required value={cEnd} onChange={e=>setCEnd(e.target.value)} type="time" className="w-full px-2 py-3 rounded-xl border-2 border-ink text-sm bg-bg focus:outline-none focus:ring-2 focus:ring-ink" />
            </div>
          </div>
          <div>
            <label htmlFor="class-room" className="block text-xs font-bold text-ink mb-2">Room / location (optional)</label>
            <input id="class-room" maxLength={120} value={cRoom} onChange={e => setCRoom(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-ink bg-bg text-ink" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={closeForm} className="py-3 px-4 border-2 border-ink rounded-xl text-ink">Cancel</button>
            <button type="submit" className="w-full py-3 bg-ink text-bg text-[9px] md:text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-bg hover:text-ink border-2 border-ink transition-colors mt-2 md:mt-0">{editingId ? "Save changes" : "Save entry"}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
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

                      <div className="text-ink font-bold text-[10px] uppercase tracking-widest border-2 border-ink bg-bg px-2 py-1 inline-block mb-3 rounded-lg">
                        {c.startTime} — {c.endTime}
                      </div>
                      <h4 className="font-bold text-ink pr-4 text-lg tracking-tight leading-tight mb-2 break-words">{c.className}</h4>
                      {c.room && <div className="text-[10px] font-bold uppercase text-sub group-hover:text-ink">Room: {c.room}</div>}
                      <div className="flex gap-2 mt-3">
                        <button type="button" onClick={() => editClass(c)} aria-label={`Edit ${c.className}`} className="min-h-11 flex-1 flex items-center justify-center gap-2 px-3 border-2 border-ink rounded-xl text-ink font-bold hover:bg-highlight"><Pencil className="w-4 h-4" /> Edit</button>
                        <button type="button" onClick={() => { if (window.confirm(`Delete ${c.className} from your schedule?`)) removeClass(c.id); }} aria-label={`Delete ${c.className}`} className="min-h-11 min-w-11 p-3 border-2 border-red-200 rounded-xl text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
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
