import React from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/settings" className="p-2 border-2 border-ink rounded-xl hover:bg-sub hover:text-bg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-ink" /> Privacy Policy
          </h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Last updated: 6 October 2026</p>
        </div>
      </div>

      <div className="bg-bg border-2 border-ink rounded-3xl p-6 md:p-8 shadow-[4px_4px_0px_var(--theme-ink)] prose prose-sm md:prose-base max-w-none prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-widest prose-h2:text-xl prose-p:font-medium prose-p:text-sub prose-strong:text-ink prose-strong:font-bold prose-ul:list-disc prose-li:text-ink">
        <h2>1. Data Collection</h2>
        <p>Personal Hub collects information you provide directly, including your email address (for authentication) and data you manually input (tasks, schedule, finances).</p>
        
        <h2>2. Data Storage & Security</h2>
        <p>Your account data is stored in Google Firebase and transmitted using encrypted connections. Firebase Auth manages your password. A local copy of your Hub data and pending changes is saved on your device; this local copy is not encrypted by the app.</p>
        
        <h2>3. Local Storage & API Keys</h2>
        <p>Your Gemini API key stays in memory for the current app session and is sent directly to Google's GenAI API when you use an AI feature. It is not saved in our database or device storage. AI features send the selected schedule, task, goal, finance summary or uploaded image to Google for processing.</p>
        
        <h2>4. Account Deletion</h2>
        <p>The current Delete Account action removes your Firebase Auth sign-in account. Cloud database records are not automatically erased by this version. Export your data before deleting your account and contact the developer to request complete cloud data removal. Clear app storage on shared devices to remove local copies and pending changes.</p>
        
        <h2>5. Third-Party Services</h2>
        <p>We use Google Firebase (Auth, Database) and Google Gemini (AI). By using Personal Hub, you also agree to their respective privacy policies and terms of service.</p>
        
        <h2>6. Contact</h2>
        <p>If you have any questions regarding this privacy policy, please contact the developer via the app's support channels or GitHub repository.</p>
      </div>
    </div>
  );
}
