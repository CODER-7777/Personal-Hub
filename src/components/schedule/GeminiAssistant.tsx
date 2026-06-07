import React, { useState } from "react";
import { useAppStore } from "../../store";
import { GoogleGenAI, Type } from "@google/genai";
import { Sparkles, Calendar, Target, Clock, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export function GeminiAssistant() {
  const { classes, tasks, goals, geminiApiKey } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  const generatePlan = async () => {
    try {
      setLoading(true);
      const apiKey = geminiApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && (process as any).env?.GEMINI_API_KEY);
      if (!apiKey) {
        toast.error("Gemini API Key missing. Please configure it in Settings.");
        setLoading(false);
        return;
      }

      // Format current data to send as context
      const today = new Date();
      const currentDayIndex = today.getDay(); // 0-6
      
      const todaysClasses = classes
        .filter(c => c.dayOfWeek === currentDayIndex)
        .sort((a,b) => a.startTime.localeCompare(b.startTime));
      
      const pendingTasks = tasks.filter(t => !t.completed);
      const activeGoals = goals.filter(g => g.currentCount < g.targetCount);

      const contextPrompt = `
      Create a highly optimized, structured daily schedule for me for today.
      
      Context:
      Today's date: ${today.toLocaleDateString()}
      
      My Classes Today:
      ${todaysClasses.length > 0 ? todaysClasses.map(c => `- ${c.className} from ${c.startTime} to ${c.endTime}`).join('\n') : "None"}
      
      Pending Tasks:
      ${pendingTasks.length > 0 ? pendingTasks.map(t => `- ${t.title} (Priority: ${t.priority}, Due: ${new Date(t.dueDate).toLocaleDateString()})`).join('\n') : "None"}
      
      Active Weekly Goals:
      ${activeGoals.length > 0 ? activeGoals.map(g => `- ${g.title} (${g.currentCount}/${g.targetCount})`).join('\n') : "None"}
      
      Instructions:
      Return the schedule strictly formatted in Markdown.
      Structure it with headings like "Morning", "Afternoon", and "Evening".
      Allocate specific times to work on my pending tasks around my classes.
      Suggest times to make progress on my active goals.
      Keep it actionable, realistic, and highly structured.
      Use bullet points and bold text for emphasis.
      `;

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [contextPrompt],
      });

      if (response.text) {
        setPlan(response.text);
        toast.success("AI Plan generated successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-line p-4 md:px-6 md:py-4 border-2 border-ink rounded-3xl shadow-[4px_4px_0px_var(--theme-ink)]">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" /> AI SCHEDULE ASSISTANT
        </h2>
        <button 
          onClick={generatePlan} 
          disabled={loading}
          className="text-[11px] font-bold uppercase tracking-widest bg-ink text-bg px-4 py-2 flex items-center gap-2 hover:bg-sub rounded-xl disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {plan ? "REGENERATE" : "GENERATE PLAN"}
        </button>
      </div>

      {!plan && !loading && (
        <div className="bg-bg border-2 border-ink border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-highlight rounded-full border-2 border-ink flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-ink" />
          </div>
          <h3 className="text-lg font-bold text-ink mb-2">Let AI plan your day</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-sub max-w-md">
            Click "Generate Plan" to let Gemini analyze your classes, pending tasks, and goals to create an optimized daily schedule.
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-bg border-2 border-ink rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-sub border-t-ink rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-ink animate-pulse">
            Analyzing context and crafting your schedule...
          </p>
        </div>
      )}

      {plan && !loading && (
        <div className="relative bg-bg border-2 border-ink rounded-3xl p-6 md:p-8 shadow-[4px_4px_0px_var(--theme-ink)] prose prose-sm md:prose-base max-w-none prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-widest prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:font-medium prose-p:text-sub prose-strong:text-ink prose-strong:font-bold prose-ul:list-disc prose-li:text-ink">
          <button 
            onClick={() => { navigator.clipboard.writeText(plan); toast.success("Plan copied to clipboard!"); }}
            className="absolute top-4 right-4 p-2 bg-line border-2 border-ink rounded-xl hover:bg-sub hover:text-bg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink not-prose"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" /> Copy
          </button>
          <ReactMarkdown>{plan}</ReactMarkdown>
        </div>
      )}
      
      {/* Context Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-line p-4 rounded-2xl border-2 border-ink flex items-center gap-4">
          <Calendar className="w-8 h-8 text-sub shrink-0" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-sub">Today's Classes</div>
            <div className="text-lg font-extrabold text-ink">{classes.filter(c => c.dayOfWeek === new Date().getDay()).length}</div>
          </div>
        </div>
        <div className="bg-line p-4 rounded-2xl border-2 border-ink flex items-center gap-4">
          <Clock className="w-8 h-8 text-sub shrink-0" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-sub">Pending Tasks</div>
            <div className="text-lg font-extrabold text-ink">{tasks.filter(t => !t.completed).length}</div>
          </div>
        </div>
        <div className="bg-line p-4 rounded-2xl border-2 border-ink flex items-center gap-4">
          <Target className="w-8 h-8 text-sub shrink-0" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-sub">Active Goals</div>
            <div className="text-lg font-extrabold text-ink">{goals.filter(g => g.currentCount < g.targetCount).length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
