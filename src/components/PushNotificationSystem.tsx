import { useEffect } from "react";
import { PushNotifications } from "@capacitor/push-notifications";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";

export function PushNotificationSystem() {
  useEffect(() => {
    // Only try to register on native platforms (Android/iOS)
    // We check if it's running natively because push notifications don't work the same way in the web browser
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      // Request permission
      PushNotifications.requestPermissions().then((result) => {
        if (result.receive === "granted") {
          // Register with Firebase
          PushNotifications.register();
        } else {
          console.warn("Push notification permission denied.");
        }
      });

      // On successful registration
      PushNotifications.addListener("registration", (token) => {
        console.log("Push registration success, token: " + token.value);
        // Normally, you would send this token to your database so you know who to message
      });

      // On registration error
      PushNotifications.addListener("registrationError", (error: any) => {
        console.error("Error on registration: " + JSON.stringify(error));
      });

      // When a push notification is received while the app is OPEN
      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        console.log("Push received: ", notification);
        toast.info(notification.title || "New Notification", {
          description: notification.body,
          duration: 10000,
          icon: '📩'
        });
      });

      // When a user taps on a push notification
      PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
        console.log("Push action performed: ", notification);
      });
    }
  }, []);

  return null;
}
