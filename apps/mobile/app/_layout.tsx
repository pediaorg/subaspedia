import "../styles/global.css";

import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <div className="bg-[#103F79] grid place-items-center p-8">
        <p className="text-[#F3B229] font-extrabold text-9xl text-pretty">
          ¡¡¡¹¡11 AZUL Y DORADO COMO EL MAS GRANDE !1!!1'111!!11
        </p>
      </div>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
      <PortalHost />
    </>
  );
}
