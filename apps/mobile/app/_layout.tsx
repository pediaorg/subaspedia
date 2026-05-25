import "../styles/global.css";

import { PortalHost } from "@rn-primitives/portal";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "burnt/web";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AccessGuard } from "@/components/access-guard";
import { queryClient } from "@/lib/query-client";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>

      <AccessGuard />

      <StatusBar style="auto" />

      <PortalHost />

      <Toaster position="bottom-right" />
    </QueryClientProvider>
  );
}
