import { useEffect, useRef } from "react";
import { isAfter, isBefore, addMinutes, parseISO, differenceInHours } from "date-fns";
import { LocalNotifications } from "@capacitor/local-notifications";
import { toast } from "sonner";
import { useAppStore } from "../store";

export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function sendNativeNotification(title: string, body: string) {
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

export function playAlarmSound() {
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

export function AlarmSystem() {
  const { reminders, markReminderTriggered, tasks } = useAppStore();
  // Track which task nags we've already sent (taskId -> last nag timestamp)
  const taskNagMap = useRef<Record<string, number>>({});

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
    LocalNotifications.requestPermissions();
  }, []);

  // ─── Sync Reminders to LocalNotifications ───
  useEffect(() => {
    async function syncNativeAlarms() {
      if (!("Notification" in window)) return; // Skip for pure web if native unavailable
      
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }

        const toSchedule = reminders
          .filter(r => !r.triggered && isAfter(parseISO(r.time), new Date()))
          .map((r, idx) => ({
            id: idx + 1000, // numerical ID
            title: "⏰ Alarm — Personal Hub",
            body: r.title,
            schedule: { at: parseISO(r.time) },
            sound: "beep.wav" // if available, or default
          }));

        if (toSchedule.length > 0) {
          await LocalNotifications.schedule({ notifications: toSchedule });
        }
      } catch (e) {
        console.warn("LocalNotifications sync failed:", e);
      }
    }
    syncNativeAlarms();
  }, [reminders]);

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
