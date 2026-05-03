import React, { useState, useRef } from "react";
import { useAppStore, ClassSession } from "../store";
import { motion } from "motion/react";
import { Calendar as CalendarIcon, Clock, Plus, Trash2, Upload, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { GoogleGenAI, Type } from "@google/genai";
import imageCompression from "browser-image-compression";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Schedule() {
  const { classes, addClasses, removeClass, tasks, addTask, toggleTask, removeTask, reminders, addReminder, removeReminder } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'classes' | 'tasks' | 'reminders'>('classes');
  
  // File upload state for timetable
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Class State
  const [cName, setCName] = useState("");
  const [cDay, setCDay] = useState("1");
  const [cStart, setCStart] = useState("");
  const [cEnd, setCEnd] = useState("");
  const [cRoom, setCRoom] = useState("");
  const [cShowAdd, setCShowAdd] = useState(false);

  // New Task State
  const [tName, setTName] = useState("");
  const [tDue, setTDue] = useState("");
  const [tPriority, setTPriority] = useState<'low'|'medium'|'high'>('medium');
  const [tShowAdd, setTShowAdd] = useState(false);

  // New Reminder State
  const [rName, setRName] = useState("");
  const [rTime, setRTime] = useState("");
  const [rShowAdd, setRShowAdd] = useState(false);

  // ---------- Handlers ----------

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if(!cName || !cStart || !cEnd) return;
    addClasses([{ id: crypto.randomUUID(), className: cName, dayOfWeek: parseInt(cDay), startTime: cStart, endTime: cEnd, room: cRoom, type: 'Class' }]);
    setCName(""); setCStart(""); setCEnd(""); setCRoom(""); setCShowAdd(false);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if(!tName || !tDue) return;
    addTask({ id: crypto.randomUUID(), title: tName, completed: false, dueDate: new Date(tDue).toISOString(), priority: tPriority });
    setTName(""); setTDue(""); setTShowAdd(false);
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if(!rName || !rTime) return;
    addReminder({ id: crypto.randomUUID(), title: rName, time: new Date(rTime).toISOString(), triggered: false });
    setRName(""); setRTime(""); setRShowAdd(false);
  };

  // ---------- AI Upload Handler ----------

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      toast.info("Analyzing timetable image...");

      // Compress image if too large (Gemini has 20MB limit but better safe and fast)
      const compressedFile = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 2048 });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: "Extract the class schedule from this timetable image. Format the days of the week as 0 (Sunday) to 6 (Saturday). Keep times in HH:mm 24-hour format." },
              { inlineData: { mimeType: file.type, data: base64Data } }
            ]
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  className: { type: Type.STRING, description: "Course name or subject" },
                  dayOfWeek: { type: Type.INTEGER, description: "0 for Sunday, 1 for Monday, etc to 6 for Saturday" },
                  startTime: { type: Type.STRING, description: "24 hour time e.g. 09:00" },
                  endTime: { type: Type.STRING, description: "24 hour time e.g. 10:30" },
                  room: { type: Type.STRING, description: "Room number if present" },
                },
                required: ["className", "dayOfWeek", "startTime", "endTime"]
              }
            }
          }
        });

        if (response.text) {
          try {
            const parsedClasses = JSON.parse(response.text);
            const classesToAdd = parsedClasses.map((c: any) => ({
              ...c,
              id: crypto.randomUUID(),
              type: 'Timetable Entry'
            }));
            
            addClasses(classesToAdd);
            toast.success(`Successfully added ${classesToAdd.length} classes from your timetable!`);
            setActiveTab('classes');
          } catch(e) {
            toast.error("Failed to parse the schedule correctly.");
            console.error(e);
          }
        }
      };
      
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      toast.error("Error processing image.");
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-4 md:space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 md:gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2">Schedule & Reminders</h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Manage your time, tasks, and custom alarms.</p>
        </div>
        
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full md:w-auto bg-ink text-bg hover:bg-sub px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex items-center justify-center gap-2 border-2 border-transparent rounded-xl disabled:opacity-50 hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1"
          >
            {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? "Scanning..." : "Upload Timetable Image"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-4">
        {[
          { id: 'classes', icon: CalendarIcon, label: 'Classes / Timetable' },
          { id: 'tasks', icon: Plus, label: 'To-Do Tasks' },
          { id: 'reminders', icon: Clock, label: 'Alarms & Reminders' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'classes'|'tasks'|'reminders')}
            className={`flex flex-1 md:flex-none justify-center items-center gap-2 px-3 md:px-5 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all border-2 rounded-xl ${
              activeTab === tab.id 
                ? 'border-ink text-ink bg-highlight shadow-[2px_2px_0px_var(--theme-ink)] md:shadow-[4px_4px_0px_var(--theme-ink)] -translate-y-1' 
                : 'border-transparent text-sub hover:text-ink hover:border-ink hover:bg-line/50'
            }`}
          >
            <tab.icon className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-bg min-h-[500px]">
        
        {/* CLASSES TAB */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-line p-4 md:px-6 md:py-4 border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink">YOUR WEEKLY SCHEDULE</h2>
              <button onClick={() => setCShowAdd(!cShowAdd)} className="text-[11px] font-bold uppercase tracking-widest bg-ink text-bg px-4 py-2 flex items-center gap-1 hover:bg-sub rounded-xl"><Plus className="w-4 h-4"/> ADD MANUAL</button>
            </div>
            
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
                            <h4 className="font-bold text-ink pr-4 text-xl tracking-tight leading-none mb-2">{c.className}</h4>
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
        )}

        {/* TASKS TAB */}
        {activeTab === 'tasks' && (
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
                      <h4 className={`text-lg md:text-xl font-bold tracking-tight ${t.completed ? 'line-through text-ink' : 'text-ink'}`}>{t.title}</h4>
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub mt-1 md:mt-2">Due: {new Date(t.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => removeTask(t.id)} className="text-sub hover:text-red-500 transition-colors p-2 self-end sm:self-auto"><Trash2 className="w-5 h-5 md:w-6 md:h-6" /></button>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-center text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-sub py-8 w-full border-2 border-ink border-dashed rounded-2xl">No tasks pending. You're free! 🎮</p>}
            </div>
          </div>
        )}

        {/* REMINDERS TAB */}
        {activeTab === 'reminders' && (
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
                    <h4 className={`text-lg md:text-xl font-bold tracking-tight mb-1 md:mb-2 pr-4 ${r.triggered ? 'text-sub line-through' : 'text-ink'}`}>{r.title}</h4>
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-ink flex items-center gap-1.5 md:gap-2"><Clock className="w-3 h-3"/> {new Date(r.time).toLocaleString()}</p>
                  </div>
                  <button onClick={() => removeReminder(r.id)} className="text-ink opacity-100 md:opacity-0 group-hover:opacity-100 hover:text-red-600 transition-opacity p-2 shrink-0"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
              {reminders.length === 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-sub text-center py-10 rounded-2xl col-span-1 md:col-span-2 border-2 border-ink border-dashed">No alarms set.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
