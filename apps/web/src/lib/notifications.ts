import { Capacitor } from "@capacitor/core";
import { isSupabaseConfigured } from "./supabase/client";
import { savePushToken } from "./supabase/api";

export async function requestPushPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== "granted") return false;
      await PushNotifications.register();
      return true;
    } catch {
      return false;
    }
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}

export async function initNativePush(userId: string) {
  if (!Capacitor.isNativePlatform() || !isSupabaseConfigured) return;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  PushNotifications.addListener("registration", (token) => {
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    savePushToken(userId, token.value, platform);
  });

  PushNotifications.addListener("pushNotificationReceived", (n) => {
    showLocalNotification(n.title ?? "Parcháte Bogotá", n.body ?? "");
  });
}

export function showLocalNotification(title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon.svg", badge: "/icon.svg" });
  } catch { /* noop */ }
}

export function notifyNearbyParche(title: string, distance: string) {
  showLocalNotification(
    "Parche cerca de ti 📍",
    `${title} — a ${distance}. ¡Abre Parcháte Bogotá!`
  );
}
