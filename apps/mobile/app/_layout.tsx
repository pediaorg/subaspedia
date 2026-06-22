import "../styles/global.css";

import { PortalHost } from "@rn-primitives/portal";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "burnt/web";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AccessGuard } from "@/components/access-guard";
import { BottomNav } from "@/components/bottom-nav/bottom-nav";
import { NotificationToaster } from "@/components/notifications/notification-toaster";
import { queryClient } from "@/lib/query-client";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
                presentation: "transparentModal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="logout" options={{ headerShown: false }} />
          </Stack>

          <BottomNav />

          <AccessGuard />

          <NotificationToaster />

          <StatusBar style="auto" />

          <PortalHost />

          <Toaster position="bottom-right" />
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
