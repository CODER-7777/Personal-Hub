import React from "react";
import { useAppStore } from "../store";
import { Settings as SettingsIcon, Key, User, Zap, ExternalLink } from "lucide-react";

export default function Settings() {
  const { 
    geminiApiKey, setGeminiApiKey, 
    profileName, setProfileName,
    animationsEnabled, setAnimationsEnabled
  } = useAppStore();

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 md:w-10 md:h-10 text-ink" /> Settings
        </h1>
        <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Configure your Hub experience.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-bg border-2 border-ink rounded-3xl p-6 md:p-8 shadow-[4px_4px_0px_var(--theme-ink)] space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <User className="w-4 h-4 text-sub" /> Profile Name
            </label>
            <input 
              type="text" 
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-line border-2 border-ink p-3 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <Key className="w-4 h-4 text-sub" /> Gemini API Key
            </label>
            <input 
              type="password" 
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full bg-line border-2 border-ink p-3 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            />
            <p className="text-[10px] md:text-xs font-bold text-sub">
              Your API key is stored locally on your device. 
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="ml-1 text-ink underline inline-flex items-center gap-1">
                Get an API Key <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <div className="flex items-center justify-between border-t-2 border-ink border-dashed pt-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
                <Zap className="w-4 h-4 text-sub" /> Enable Animations
              </div>
              <p className="text-[10px] md:text-xs font-bold text-sub mt-1">
                Toggle the crazy intro and smooth transitions.
              </p>
            </div>
            <button 
              onClick={() => setAnimationsEnabled(!animationsEnabled)}
              className={`w-12 h-6 md:w-14 md:h-7 rounded-full flex items-center p-1 transition-colors border-2 border-ink ${animationsEnabled ? 'bg-ink' : 'bg-line'}`}
            >
              <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full transition-transform ${animationsEnabled ? 'translate-x-6 md:translate-x-7 bg-bg' : 'translate-x-0 bg-sub'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
