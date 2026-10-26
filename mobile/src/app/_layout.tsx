import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { DarkTheme, Stack, ThemeProvider, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { SessionProvider, useSession } from "@/lib/session";
import { StreakProvider } from "@/lib/streak";
import { C, FONT_FILES } from "@/lib/theme";
import "@/lib/push";
import { OpeningSpin } from "@/components/OpeningSpin";

SplashScreen.preventAutoHideAsync();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.bg, text: C.ink, border: C.line, primary: C.orange },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  return (
    <SessionProvider>
      <StreakProvider>
        <ThemeProvider value={theme}>
          <StatusBar style="light" />
          <Gate fontsReady={fontsLoaded || !!fontError} />
        </ThemeProvider>
      </StreakProvider>
    </SessionProvider>
  );
}

function Gate({ fontsReady }: { fontsReady: boolean }) {
  const { ready, session } = useSession();
  const show = ready && fontsReady;

  useEffect(() => {
    if (show) SplashScreen.hideAsync();
  }, [show]);

  if (!show) return null;
  return (
    <>
      {Platform.OS !== "web" && session && <NotificationTaps />}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        {/* Anyone can look around. Signing in closes the sign-in screen by itself. */}
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="day/[date]" />
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
      {Platform.OS !== "web" && <OpeningSpin />}
    </>
  );
}

// Tapping the morning notification opens today's album.
function NotificationTaps() {
  const response = Notifications.useLastNotificationResponse();
  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const path = response.notification.request.content.data?.path;
    router.navigate(path === "/account" ? "/account" : "/");
  }, [response]);
  return null;
}
