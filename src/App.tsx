import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Sidebar, MobileNav, MobileHeader } from "./components/Navigation";
import { useAppStore, initFirebaseSync } from "./store";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

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
import { SplashIntro } from "./components/SplashIntro";
import { AlarmSystem } from "./components/AlarmSystem";
import { ThemeLoader } from "./components/ThemeLoader";

// ─── APP ─────────────────────────────────

export default function App() {
  const { theme } = useAppStore();
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

  return (
    <BrowserRouter>
      <ThemeLoader />
      <AlarmSystem />
      <div className="flex h-screen bg-bg text-ink font-sans overflow-hidden transition-colors">
        <Sidebar />
        <main className="flex-1 overflow-hidden p-0 md:p-4 bg-line relative flex flex-col md:flex-row print:bg-bg print:p-0">
          <div className="bg-bg h-full flex-1 flex flex-col md:rounded-3xl md:border-2 border-ink md:shadow-[4px_4px_0px_var(--theme-ink)] overflow-hidden transition-all print:shadow-none print:border-none print:rounded-none">
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
                <Route path="/settings" element={<Settings />} />
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

