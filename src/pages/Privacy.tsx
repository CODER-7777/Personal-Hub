import React from "react";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/settings" className="p-2 border-2 border-ink rounded-xl hover:bg-sub hover:text-bg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 md:w-10 md:h-10 text-ink" /> Privacy Policy
          </h1>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="bg-bg border-2 border-ink rounded-3xl p-6 md:p-8 shadow-[4px_4px_0px_var(--theme-ink)] prose prose-sm md:prose-base max-w-none prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-widest prose-h2:text-xl prose-p:font-medium prose-p:text-sub prose-strong:text-ink prose-strong:font-bold prose-ul:list-disc prose-li:text-ink">
        <h2>1. Data Collection</h2>
        <p>Personal Hub collects information you provide directly, including your email address (for authentication) and data you manually input (tasks, schedule, finances).</p>
        
        <h2>2. Data Storage & Security</h2>
        <p>Your data is securely stored using Google Firebase. Passwords and authentication tokens are encrypted by Firebase Auth. Realtime data is transmitted securely via HTTPS.</p>
        
        <h2>3. Local Storage & API Keys</h2>
        <p>Your Gemini API Key is stored <strong>locally</strong> on your device and is only sent directly to Google's GenAI API for processing. It is never stored on our database.</p>
        
        <h2>4. Account Deletion</h2>
        <p>You have the right to delete your account and all associated data at any time via the Settings page. Deleting your account will immediately remove your authentication records.</p>
        
        <h2>5. Third-Party Services</h2>
        <p>We use Google Firebase (Auth, Database) and Google Gemini (AI). By using Personal Hub, you also agree to their respective privacy policies and terms of service.</p>
        
        <h2>6. Contact</h2>
        <p>If you have any questions regarding this privacy policy, please contact the developer via the app's support channels or GitHub repository.</p>
      </div>
    </div>
  );
}
