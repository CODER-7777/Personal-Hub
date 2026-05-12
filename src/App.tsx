import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { isAfter, isBefore, addMinutes, parseISO } from "date-fns";
import { Sidebar, MobileNav, MobileHeader } from "./components/Navigation";
import { useAppStore, initFirebaseSync } from "./store";

// Initialize Firebase Realtime Sync
initFirebaseSync();

import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Resources from "./pages/Resources";
import Finances from "./pages/Finances";
import Contests from "./pages/Contests";
import Focus from "./pages/Focus";
import Habits from "./pages/Habits";
import Notes from "./pages/Notes";

function AlarmSystem() {
  const { reminders, markReminderTriggered } = useAppStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach((rem) => {
        if (!rem.triggered) {
          const remTime = parseISO(rem.time);
          if (isAfter(now, remTime) && isBefore(now, addMinutes(remTime, 5))) {
            toast.message("Reminder", {
              description: rem.title,
              duration: 10000,
              icon: '⏰',
            });
            // Mark as triggered so we don't spam
            markReminderTriggered(rem.id);
          }
        }
      });
    }, 10000); // check every 10 seconds

    return () => clearInterval(interval);
  }, [reminders, markReminderTriggered]);

  return null;
}

function ThemeLoader() {
  const { theme } = useAppStore();
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  return null;
}

export default function App() {
  const { theme } = useAppStore();
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
                <Route path="/focus" element={<Focus />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/finances" element={<Finances />} />
                <Route path="/contests" element={<Contests />} />
              </Routes>
            </div>
          </div>
        </main>
        <MobileNav />
      </div>
      <Toaster position="top-right" theme={theme} />
    </BrowserRouter>
  );
}
