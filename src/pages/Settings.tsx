import React from "react";
import { useAppStore } from "../store";
import { Settings as SettingsIcon, Key, User, Zap, ExternalLink, Trash2, LogOut, FileText, Code, Image, Mail, Download } from "lucide-react";
import { auth } from "../lib/firebase";
import { signOut, deleteUser } from "firebase/auth";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { safeExternalUrl } from "../lib/urls";

export default function Settings() {
  const store = useAppStore();
  const [profileDirty, setProfileDirty] = React.useState(false);

  // Local state for manual saving
  const [geminiApiKey, setGeminiApiKey] = React.useState(store.geminiApiKey);
  const [profileName, setProfileName] = React.useState(store.profileName);
  const [cfHandle, setCfHandle] = React.useState(store.cfHandle);
  const [profilePicture, setProfilePicture] = React.useState(store.profilePicture);
  const [animationsEnabled, setAnimationsEnabled] = React.useState(store.animationsEnabled);
  
  React.useEffect(() => {
    if (!profileDirty) {
      setProfileName(store.profileName); setCfHandle(store.cfHandle); setProfilePicture(store.profilePicture);
    }
  }, [store.profileName, store.cfHandle, store.profilePicture, profileDirty]);

  const handleSaveSettings = () => {
    if (!profileName.trim()) { toast.error("Please enter your name."); return; }
    if (profilePicture.trim() && (!safeExternalUrl(profilePicture.trim()) || !profilePicture.trim().toLowerCase().startsWith('https://'))) {
      toast.error("Profile pictures must use an HTTPS URL."); return;
    }
    store.setGeminiApiKey(geminiApiKey);
    useAppStore.setState({ profileName: profileName.trim(), cfHandle: cfHandle.trim(), profilePicture: profilePicture.trim() });
    setProfileDirty(false);
    store.setAnimationsEnabled(animationsEnabled);
    toast.success("Changes saved on this device. Your profile will sync when online.");
  };

  const handleProfileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip emojis
    const cleanName = e.target.value.replace(/\p{Emoji_Presentation}/gu, '');
    setProfileDirty(true);
    setProfileName(cleanName);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Delete your sign-in account? This cannot be undone. Cloud records are not automatically erased in this version; export your data first and contact the developer for complete data removal.")) {
      try {
        if (auth.currentUser) {
          await deleteUser(auth.currentUser);
          toast.success("Account deleted successfully");
        }
      } catch (error: any) {
        toast.error(error.message || "Failed to delete account. Please log in again to perform this action.");
      }
    }
  };

  const handleExportData = () => {
    try {
      const state = useAppStore.getState();
      const exportData = {
        classes: state.classes,
        tasks: state.tasks,
        resources: state.resources,
        expenses: state.expenses,
        reminders: state.reminders,
        pomodoroSessions: state.pomodoroSessions,
        habits: state.habits,
        notes: state.notes,
        goals: state.goals,
        monthlyGoals: state.monthlyGoals,
        profileName: state.profileName,
        cfHandle: state.cfHandle,
        profilePicture: state.profilePicture,
        financeReports: state.financeReports,
        lastResetMonth: state.lastResetMonth,
        exportedAt: new Date().toISOString(),
        schemaVersion: 1,
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `personal_hub_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully!");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tighter text-ink mb-1 md:mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 md:w-10 md:h-10 text-ink" /> Settings
        </h1>
        <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Configure your Hub experience.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-line border-2 border-ink rounded-3xl p-6 space-y-3" role="status">
          <h2 className="font-bold text-ink">Account sync</h2>
          <p className="text-sm text-sub">{store.pendingSyncCount ? `${store.pendingSyncCount} changes waiting to sync.` : store.syncStatus === 'connected' ? 'Your Hub is synced.' : 'Waiting for a cloud connection.'}</p>
          {store.syncError && <p className="text-sm text-red-600">{store.syncError}</p>}
          <button onClick={store.forceSync} className="min-h-11 px-4 py-3 bg-ink text-bg rounded-xl font-bold">Retry pending sync</button>
        </div>
        <div className="bg-bg border-2 border-ink rounded-3xl p-6 md:p-8 shadow-[4px_4px_0px_var(--theme-ink)] space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <User className="w-4 h-4 text-sub" /> Profile Name
            </label>
            <input 
              type="text" 
              maxLength={80}
              value={profileName}
              onChange={handleProfileNameChange}
              placeholder="Your Name"
              className="w-full bg-line border-2 border-ink p-3 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <Image className="w-4 h-4 text-sub" /> Profile Picture URL
            </label>
            <input 
              type="text" 
              value={profilePicture}
              onChange={(e) => { setProfileDirty(true); setProfilePicture(e.target.value); }}
              placeholder="https://example.com/avatar.png"
              className="w-full bg-line border-2 border-ink p-3 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            />
            {profilePicture && (
              <div className="mt-2 flex items-center gap-2">
                <img src={profilePicture} alt="Profile preview" className="w-10 h-10 rounded-full border-2 border-ink object-cover" />
                <span className="text-[10px] font-bold text-sub uppercase tracking-widest">Preview</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <Code className="w-4 h-4 text-sub" /> Codeforces Handle
            </label>
            <input 
              type="text" 
              maxLength={80}
              value={cfHandle}
              onChange={(e) => { setProfileDirty(true); setCfHandle(e.target.value); }}
              placeholder="e.g. tourist"
              className="w-full bg-line border-2 border-ink p-3 rounded-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <Mail className="w-4 h-4 text-sub" /> Email Address
            </label>
            <input 
              type="text" 
              value={auth.currentUser?.email || "Not logged in"}
              readOnly
              className="w-full bg-line border-2 border-ink p-3 rounded-xl font-bold text-sub cursor-not-allowed opacity-70 focus:outline-none"
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
              Your API key stays in memory for this session. Enter it again after restarting the app.
              <a href="https://ai.google.dev/gemini-api/docs/api-key" target="_blank" rel="noopener noreferrer" className="ml-1 text-ink underline inline-flex items-center gap-1">
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

          <div className="border-t-2 border-ink border-dashed pt-6 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2">
              <span className="w-4 h-4 text-sub flex items-center justify-center font-serif">G</span> Google Calendar Sync
            </div>
            <p className="text-[10px] md:text-xs font-bold text-sub">
              Google Calendar integration is planned and is not available yet. Your Hub schedule already syncs between devices using your account.
            </p>
          </div>

          <div className="border-t-2 border-ink border-dashed pt-6">
            <button 
              onClick={handleSaveSettings}
              className="w-full bg-ink text-bg px-6 py-4 rounded-xl font-extrabold uppercase tracking-widest text-sm transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_var(--theme-ink)] flex items-center justify-center gap-2"
            >
              <SettingsIcon className="w-5 h-5" /> Save Changes
            </button>
          </div>
        </div>

        {/* ACCOUNT MANAGEMENT */}
        <div className="bg-bg border-2 border-ink rounded-3xl p-6 md:p-8 shadow-[4px_4px_0px_var(--theme-ink)] space-y-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2 mb-4">
              <Download className="w-4 h-4 text-sub" /> Data Management
            </div>
            
            <button 
              onClick={handleExportData}
              className="w-full bg-line border-2 border-ink p-4 rounded-xl font-bold text-ink hover:bg-sub hover:text-bg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Export All Data (JSON)
            </button>
          </div>

          <div className="border-t-2 border-ink border-dashed pt-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-ink flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-sub" /> Account Management
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={handleLogout}
                className="w-full bg-line border-2 border-ink p-4 rounded-xl font-bold text-ink hover:bg-sub hover:text-bg transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log Out
              </button>
              
              <button 
                onClick={handleDeleteAccount}
                className="w-full bg-red-50 text-red-600 border-2 border-red-200 p-4 rounded-xl font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>

          <div className="border-t-2 border-ink border-dashed pt-6">
            <Link 
              to="/privacy"
              className="w-full bg-line border-2 border-ink p-4 rounded-xl font-bold text-ink hover:bg-sub hover:text-bg transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" /> Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
