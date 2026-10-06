import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Sidebar, MobileNav, MobileHeader } from "./components/Navigation";
import { useAppStore, initFirebaseSync } from "./store";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

// Initialize Firebase Realtime Sync
initFirebaseSync();

import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Resources from "./pages/Resources";
import Finances from "./pages/Finances";
import Contests from "./pages/Contests";
import Notes from "./pages/Notes";
import Goals from "./pages/Goals";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Privacy from "./pages/Privacy";
import Habits from "./pages/Habits";
import { SplashIntro } from "./components/SplashIntro";
import { AlarmSystem } from "./components/AlarmSystem";
import { PushNotificationSystem } from "./components/PushNotificationSystem";
import { LocalNotificationSystem } from "./components/LocalNotificationSystem";
import { ThemeLoader } from "./components/ThemeLoader";

// ─── APP ─────────────────────────────────

export default function App() {
  const { theme, syncReady, syncOwnerUid, syncError, forceSync } = useAppStore();
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (showSplash) {
    return (
      <>
        <ThemeLoader />
        <SplashIntro onComplete={() => setShowSplash(false)} />
      </>
    );
  }

  if (authLoading) {
    return <div className="h-screen w-screen bg-bg" />;
  }

  if (!user) {
    return (
      <>
        <ThemeLoader />
        <Auth />
        <Toaster position="top-right" theme={theme} richColors />
      </>
    );
  }

  if (!syncReady || syncOwnerUid !== user.uid) {
    return (
      <div className="min-h-screen bg-bg text-ink flex items-center justify-center p-6">
        <ThemeLoader />
        <div className="max-w-md space-y-4 text-center" role="status">
          <h1 className="text-xl font-bold">Loading your Hub</h1>
          <p>{syncError || 'Waiting for your account data. Connect to the internet for the first sign-in on this device.'}</p>
          <div className="flex justify-center gap-4">
            <button onClick={forceSync} className="border-2 border-ink rounded-xl px-4 py-3">Retry</button>
            <button onClick={() => void signOut(auth)} className="border-2 border-ink rounded-xl px-4 py-3">Sign out</button>
          </div>
        </div>
        <Toaster position="top-right" theme={theme} richColors />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ThemeLoader />
      <AlarmSystem />
      <PushNotificationSystem />
      <LocalNotificationSystem />
      <div className="flex h-screen bg-bg text-ink font-sans overflow-hidden transition-colors">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative flex flex-col print:bg-bg">
          <div className="bg-bg h-full flex-1 flex flex-col overflow-hidden transition-all print:shadow-none print:border-none print:rounded-none">
            <MobileHeader />
            <div className="flex-1 overflow-y-auto print:overflow-visible pb-24 md:pb-0">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/finances" element={<Finances />} />
                <Route path="/contests" element={<Contests />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
      <Toaster position="top-right" theme={theme} richColors />
    </BrowserRouter>
  );
}

