import { LocalNotifications } from '@capacitor/local-notifications';
import { Task, Reminder } from '../store/types';

// Request permissions on app load (can be called in App.tsx if desired)
export async function setupLocalNotifications() {
  try {
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display === 'prompt') {
      await LocalNotifications.requestPermissions();
    }
  } catch (error) {
    console.warn("Local notifications not supported on this platform", error);
  }
}

export async function scheduleTaskNotification(task: Task) {
  try {
    const deadlineTime = new Date(task.dueDate).getTime();
    if (isNaN(deadlineTime) || deadlineTime < Date.now()) return;

    const notifyTime = new Date(deadlineTime - (15 * 60 * 1000)); // 15 mins before

    if (notifyTime.getTime() > Date.now()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Approaching Deadline! ⏰",
            body: `Your task '${task.title}' is due in 15 minutes.`,
            id: Math.floor(Math.random() * 1000000), // Simple random ID
            schedule: { at: notifyTime },
            // sound: "beep.wav", // Uncomment and add beep.wav to your public/android assets to enable custom sound
          }
        ]
      });
    }
  } catch (error) {
    console.error("Failed to schedule task notification", error);
  }
}

export async function scheduleReminderNotification(reminder: Reminder) {
  try {
    const notifyTime = new Date(reminder.time);
    if (isNaN(notifyTime.getTime()) || notifyTime.getTime() < Date.now()) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Reminder! 🔔",
          body: reminder.title,
          id: Math.floor(Math.random() * 1000000),
          schedule: { at: notifyTime },
          // sound: "beep.wav",
        }
      ]
    });
  } catch (error) {
    console.error("Failed to schedule reminder notification", error);
  }
}

export async function scheduleContestNotifications(contests: any[]) {
  try {
    const notificationsToSchedule = [];

    for (const contest of contests) {
      const startTime = new Date(contest.startTimeSeconds * 1000).getTime();
      const notifyTime = new Date(startTime - (30 * 60 * 1000)); // 30 mins before

      // Schedule if it's in the future and within the next 7 days
      if (notifyTime.getTime() > Date.now() && notifyTime.getTime() < Date.now() + (7 * 24 * 60 * 60 * 1000)) {
        notificationsToSchedule.push({
          title: "Contest Starting Soon! 🏆",
          body: `${contest.name} starts in 30 minutes!`,
          id: contest.id, // Deterministic ID to avoid duplicates
          schedule: { at: notifyTime },
          // sound: "beep.wav",
        });
      }
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToSchedule
      });
      console.log(`Scheduled ${notificationsToSchedule.length} contest notifications`);
    }
  } catch (error) {
    console.error("Failed to schedule contest notifications", error);
  }
}
