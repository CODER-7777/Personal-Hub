import { useEffect } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { useAppStore } from "../store";
import { format, subDays, addDays } from "date-fns";

export function LocalNotificationSystem() {
  const { classes, tasks, habits } = useAppStore();

  useEffect(() => {
    const setupNotifications = async () => {
      // Only run natively (LocalNotifications requires native capacitor context, throws on Web sometimes)
      if (!Capacitor.isPluginAvailable("LocalNotifications")) return;
      
      const isNative = Capacitor.isNativePlatform();
      if (!isNative) return;

      try {
        // Request permissions
        const permStatus = await LocalNotifications.requestPermissions();
        if (permStatus.display !== "granted") return;

        // Cancel any existing notifications so we don't spam
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

        // Calculate data for the notification
        const tomorrow = addDays(new Date(), 1);
        const tomorrowDayOfWeek = tomorrow.getDay();
        
        const tomorrowClasses = classes.filter(c => c.dayOfWeek === tomorrowDayOfWeek);
        const pendingTasks = tasks.filter(t => !t.completed);
        
        // Find best habit streak
        let bestStreak = 0;
        let bestHabitName = "";
        
        habits.forEach(habit => {
          if (!habit.completions || habit.completions.length === 0) return;
          let streak = 0;
          const today = new Date();
          const todayStr = format(today, "yyyy-MM-dd");
          const yesterdayStr = format(subDays(today, 1), "yyyy-MM-dd");
          
          if (!habit.completions.includes(todayStr) && !habit.completions.includes(yesterdayStr)) return;
          
          let checkDate = habit.completions.includes(todayStr) ? today : subDays(today, 1);
          while (habit.completions.includes(format(checkDate, "yyyy-MM-dd"))) {
            streak++;
            checkDate = subDays(checkDate, 1);
          }
          
          if (streak > bestStreak) {
            bestStreak = streak;
            bestHabitName = habit.name;
          }
        });

        // Build notification body
        let bodyText = `Good morning! You have ${tomorrowClasses.length} classes today and ${pendingTasks.length} pending tasks.`;
        if (bestStreak >= 3) {
          bodyText += ` You also have a ${bestStreak}-day streak on '${bestHabitName}'—don't break it!`;
        }

        // Schedule for 8:00 AM tomorrow
        const scheduleDate = new Date();
        scheduleDate.setDate(scheduleDate.getDate() + 1);
        scheduleDate.setHours(8, 0, 0, 0);

        await LocalNotifications.schedule({
          notifications: [
            {
              title: "Your Morning Briefing",
              body: bodyText,
              id: 1,
              schedule: { at: scheduleDate, allowWhileIdle: true },
              smallIcon: "ic_stat_icon_config_sample", // Uses default android icon if configured
              actionTypeId: "",
            }
          ]
        });

      } catch (error) {
        console.error("Failed to schedule local notification:", error);
      }
    };

    setupNotifications();
  }, [classes, tasks, habits]);

  return null;
}
