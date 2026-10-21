import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

const TOKEN_KEY = "push_token";

// Show the morning notification even if the app happens to be open.
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export function savedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Asks permission, gets this phone's push token and saves it against the signed-in person.
export async function turnOnNotifications(): Promise<void> {
  if (Platform.OS === "web") throw new Error("Notifications work in the phone app, not in a browser.");
  if (!Device.isDevice) throw new Error("Notifications need a real phone, not a simulator.");

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Daily album",
      importance: AndroidImportance.DEFAULT,
      lightColor: "#FF4F12",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted;
  if (!granted && current.canAskAgain) granted = (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) throw new Error("Notifications are blocked for Album of the Day. Turn them on in your phone's Settings, then try again.");

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error("This build isn't linked to the Expo project yet, so it can't get notifications.");
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  const { error } = await supabase.rpc("register_device_token", { t: token, p: Platform.OS });
  if (error) throw new Error("Couldn't save this phone. Try again.");
  localStorage.setItem(TOKEN_KEY, token);
}

export async function turnOffNotifications(): Promise<void> {
  const token = savedToken();
  if (token) await supabase.from("device_tokens").delete().eq("token", token);
  localStorage.removeItem(TOKEN_KEY);
}

// Is this phone signed up for the signed-in person? (The token moves if someone else signs in here.)
export async function notificationsOn(): Promise<boolean> {
  const token = savedToken();
  if (!token) return false;
  const { data } = await supabase.from("device_tokens").select("id").eq("token", token).maybeSingle();
  return !!data;
}
