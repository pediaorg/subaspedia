import "../styles/global.css";

import { PortalHost } from "@rn-primitives/portal";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "burnt/web";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox, Platform, StyleSheet, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AccessGuard } from "@/components/access-guard";
import { BottomNav } from "@/components/bottom-nav/bottom-nav";
import { NotificationToaster } from "@/components/notifications/notification-toaster";
import { queryClient } from "@/lib/query-client";

// La app está pensada para mobile. En web limitamos el ancho a una columna
// tipo teléfono y la centramos, con los márgenes laterales en un gris neutro,
// para que no se vea estirada a lo ancho. En nativo no se toca nada.
const isWeb = Platform.OS === "web";

// Silenciamos dos warnings de DEV que NO son de la app: los emite la librería de
// estilos buggeada (NativeWind 5 preview / react-native-css@3.0.7) al inyectar
// global.css en el mount (ver stack: styleEffect.run / __react_native_css_style_
// collection.inject). No aparecen en release. Ver memoria
// react-native-css-textalign-crash. Para volver a verlos, comentá esto.
LogBox.ignoreLogs([
  "Can't perform a React state update on a component that hasn't mounted yet",
  "Text strings must be rendered within a <Text> component",
]);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <View style={styles.shell}>
            <View style={styles.column}>
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
                <Stack.Screen
                  name="register"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="logout" options={{ headerShown: false }} />
                <Stack.Screen
                  name="insurances/index"
                  options={{ headerShown: false }}
                />
              </Stack>

              <BottomNav />

              <AccessGuard />

              <NotificationToaster />

              <StatusBar style="auto" />

              <PortalHost />

              <Toaster position="bottom-right" />
            </View>
          </View>
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // Contenedor exterior: ocupa toda la pantalla y centra la columna. En web
  // pinta los márgenes laterales; en nativo es un simple flex:1 transparente.
  shell: {
    flex: 1,
    ...(isWeb ? { alignItems: "center", backgroundColor: "#e5e5e5" } : null),
  },
  // Columna de la app: ancho completo en nativo; acotada y centrada en web.
  column: {
    flex: 1,
    width: "100%",
    ...(isWeb
      ? { maxWidth: 624, position: "relative", backgroundColor: "#ffffff" }
      : null),
  },
});
