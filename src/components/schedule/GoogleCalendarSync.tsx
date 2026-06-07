import React, { useState } from "react";
import { Calendar, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "../../store";
import { Device } from "@capacitor/device";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { auth } from "../../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// NOTE: You must place your Web Client ID here for Android to work
const GOOGLE_CLIENT_ID = "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com"; 

export function GoogleCalendarSync() {
  const { classes } = useAppStore();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      
      const info = await Device.getInfo();
      let accessToken = "";

      if (info.platform === 'android' || info.platform === 'ios') {
        // Native Capacitor App - Use Native Google Sign-In
        GoogleAuth.initialize({
          clientId: GOOGLE_CLIENT_ID,
          scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.events'],
          grantOfflineAccess: true,
        });

        const response = await GoogleAuth.signIn();
        accessToken = response.authentication.accessToken;
      } else {
        // Web - Use Firebase Auth with Google Provider
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/calendar.events');
        
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          accessToken = credential.accessToken;
        } else {
          throw new Error("No access token found");
        }
      }

      if (!accessToken) throw new Error("Failed to retrieve Google Access Token.");

      // Sync all classes to Calendar
      // This is a naive implementation: it creates a single event for each class in the current week.
      // A robust implementation would use recurrence rules (RRULE).
      let added = 0;
      
      for (const cls of classes) {
        // Get the date for the *next* occurrence of this class day
        const today = new Date();
        const currentDay = today.getDay();
        const distance = (cls.dayOfWeek + 7 - currentDay) % 7;
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + distance);

        const startDateStr = targetDate.toISOString().split('T')[0];
        
        const startTimeStr = `${startDateStr}T${cls.startTime}:00`;
        const endTimeStr = `${startDateStr}T${cls.endTime}:00`;

        const event = {
          summary: cls.className,
          location: cls.room || '',
          description: `Class Type: ${cls.type || 'Lecture'}`,
          start: {
            dateTime: new Date(startTimeStr).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          end: {
            dateTime: new Date(endTimeStr).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        };

        const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });

        if (res.ok) {
          added++;
        }
      }

      setSynced(true);
      toast.success(`Successfully synced ${added} classes to Google Calendar!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to sync to Google Calendar. Make sure you accepted the permissions.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-bg border-2 border-ink rounded-3xl p-6 md:p-8 shadow-[4px_4px_0px_var(--theme-ink)] space-y-4">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-highlight border-2 border-ink rounded-xl">
          <Calendar className="w-6 h-6 text-ink" />
        </div>
        <div>
          <h3 className="text-sm md:text-base font-extrabold uppercase tracking-widest text-ink">Google Calendar Sync</h3>
          <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sub">Sync your weekly classes to your primary calendar</p>
        </div>
      </div>
      
      <button 
        onClick={handleSync}
        disabled={syncing || classes.length === 0}
        className="w-full bg-ink text-bg py-4 rounded-xl font-extrabold uppercase tracking-widest text-xs md:text-sm hover:bg-sub hover:shadow-[4px_4px_0px_var(--theme-sub)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {syncing ? <RefreshCw className="w-5 h-5 animate-spin" /> : synced ? <CheckCircle2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
        {syncing ? "Syncing to Google..." : synced ? "Synced Successfully" : "Sync Classes to Google Calendar"}
      </button>

      {classes.length === 0 && (
        <p className="text-xs text-red-500 font-bold text-center mt-2">You need to add classes first before syncing.</p>
      )}
    </div>
  );
}
