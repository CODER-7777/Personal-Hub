import React, { useState, useRef } from "react";
import { useAppStore } from "../store";
import { Sparkles, Calendar as CalendarIcon, Clock, Plus, Upload, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { GoogleGenAI, Type } from "@google/genai";
import imageCompression from "browser-image-compression";

import { ClassesTab } from "../components/schedule/ClassesTab";
import { TasksTab } from "../components/schedule/TasksTab";
import { RemindersTab } from "../components/schedule/RemindersTab";
import { TemplateGuideModal } from "../components/schedule/TemplateGuideModal";
import { GeminiAssistant } from "../components/schedule/GeminiAssistant";

export default function Schedule() {
  const { addClasses } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'classes' | 'tasks' | 'reminders' | 'ai'>('classes');
  
  // File upload state for timetable
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTemplateGuide, setShowTemplateGuide] = useState(false);

  // ---------- AI Upload Handler ----------

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      toast.info("Analyzing timetable image...");

      // Compress image if too large
      const compressedFile = await imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 2048 });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && (process as any).env?.GEMINI_API_KEY);
        if (!apiKey) {
          toast.error("Gemini API Key missing in environment variables.");
          setIsUploading(false);
          return;
        }
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: "Extract the class schedule from this timetable image. Format the days of the week as 0 (Sunday) to 6 (Saturday). Keep times in HH:mm 24-hour format." },
              { inlineData: { mimeType: file.type, data: base64Data } }
            ]
          },
          config: {
            safetySettings: [],
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
          <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2">Schedule & Reminders</h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Manage your time, tasks, and custom alarms.</p>
        </div>
        
        <div className="flex gap-2 md:gap-3 w-full md:w-auto">
          <button 
            type="button"
            onClick={() => setShowTemplateGuide(true)}
            className="w-full md:w-auto bg-bg text-ink hover:bg-line px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex items-center justify-center gap-2 border-2 border-ink rounded-xl hover:shadow-[4px_4px_0px_var(--theme-ink)] hover:-translate-y-1"
          >
            <AlertCircle className="w-4 h-4" /> Template Guide
          </button>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full md:w-auto bg-ink text-bg hover:bg-sub px-4 md:px-6 py-3 font-bold uppercase tracking-widest text-[9px] md:text-[11px] transition-all flex items-center justify-center gap-2 border-2 border-transparent rounded-xl disabled:opacity-50 hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1"
          >
            {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? "Scanning..." : "Upload Timetable"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-4">
        {[
          { id: 'classes', icon: CalendarIcon, label: 'Classes / Timetable' },
          { id: 'tasks', icon: Plus, label: 'To-Do Tasks' },
          { id: 'reminders', icon: Clock, label: 'Alarms & Reminders' },
          { id: 'ai', icon: Sparkles, label: '✨ AI Plan' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'classes'|'tasks'|'reminders'|'ai')}
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
        {activeTab === 'classes' && <ClassesTab />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'reminders' && <RemindersTab />}
        {activeTab === 'ai' && <GeminiAssistant />}
      </div>

      {showTemplateGuide && <TemplateGuideModal onClose={() => setShowTemplateGuide(false)} />}
    </div>
  );
}
