import { useEffect, useRef, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster, toast } from "sonner";
import { isAfter, isBefore, addMinutes, addHours, parseISO, differenceInHours } from "date-fns";
import { Sidebar, MobileNav, MobileHeader } from "./components/Navigation";
import { useAppStore, initFirebaseSync } from "./store";

// Initialize Firebase Realtime Sync
initFirebaseSync();

import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Resources from "./pages/Resources";
import Finances from "./pages/Finances";
import Contests from "./pages/Contests";
import Notes from "./pages/Notes";

// ─── NOTIFICATION HELPERS ─────────────────────────────────

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendNativeNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/vite.svg",
      badge: "/vite.svg",
      requireInteraction: true,
      tag: title + body, // deduplicate
    });
    // Auto-close after 30 seconds
    setTimeout(() => notification.close(), 30000);
  }
}

function playAlarmSound() {
  try {
    // Create a beeping alarm using Web Audio API (no external file needed)
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playBeep = (freq: number, startTime: number, duration: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    // Play 3 beeps
    const now = audioCtx.currentTime;
    playBeep(880, now, 0.2);
    playBeep(880, now + 0.3, 0.2);
    playBeep(1100, now + 0.6, 0.4);
  } catch (e) {
    console.warn("Could not play alarm sound:", e);
  }
}

// ─── ALARM SYSTEM ─────────────────────────────────

function AlarmSystem() {
  const { reminders, markReminderTriggered, tasks } = useAppStore();
  // Track which task nags we've already sent (taskId -> last nag timestamp)
  const taskNagMap = useRef<Record<string, number>>({});

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // ─── Reminder Alarm Check ───
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach((rem) => {
        if (!rem.triggered) {
          const remTime = parseISO(rem.time);
          if (isAfter(now, remTime) && isBefore(now, addMinutes(remTime, 5))) {
            // Play alarm sound
            playAlarmSound();

            // Show in-app toast
            toast.message("⏰ ALARM", {
              description: rem.title,
              duration: 15000,
              icon: '🔔',
            });

            // Send native browser notification
            sendNativeNotification("⏰ Alarm — Personal Hub", rem.title);

            markReminderTriggered(rem.id);
          }
        }
      });
    }, 10000); // check every 10 seconds

    return () => clearInterval(interval);
  }, [reminders, markReminderTriggered]);

  // ─── Task Due-Date Nag Check (every 5 hours) ───
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      tasks.forEach((task) => {
        if (task.completed) return;

        const dueDate = parseISO(task.dueDate);
        // Only nag if the due date is within the next 48 hours or already overdue
        const hoursUntilDue = differenceInHours(dueDate, now);
        if (hoursUntilDue > 48) return;

        const lastNag = taskNagMap.current[task.id] || 0;
        const hoursSinceLastNag = (now.getTime() - lastNag) / (1000 * 60 * 60);

        // Nag every 5 hours
        if (hoursSinceLastNag >= 5) {
          const isOverdue = isAfter(now, dueDate);
          const urgency = isOverdue ? "🚨 OVERDUE" : "⚠️ Due Soon";
          const message = `${urgency}: "${task.title}" — Due ${isOverdue ? 'was' : 'is'} ${dueDate.toLocaleDateString()}`;

          playAlarmSound();

          toast.warning(message, {
            duration: 12000,
            icon: isOverdue ? '🚨' : '⚠️',
          });

          sendNativeNotification(
            `${urgency} — Personal Hub`,
            `"${task.title}" is ${isOverdue ? 'overdue!' : 'due soon!'} (${dueDate.toLocaleDateString()})`
          );

          taskNagMap.current[task.id] = now.getTime();
        }
      });
    }, 60000); // check every 60 seconds

    return () => clearInterval(interval);
  }, [tasks]);

  return null;
}

// ─── THEME LOADER ─────────────────────────────────

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

// ─── APP ─────────────────────────────────

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
      <Toaster position="top-right" theme={theme} richColors />
    </BrowserRouter>
  );
}
