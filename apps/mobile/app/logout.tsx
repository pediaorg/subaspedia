import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { authStore } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";

// Destino de los universal links de los mails (ej. "cerrá sesión y volvé a
// entrar para que se actualice tu categoría / habilitación de pujas").
// Limpia la sesión actual y manda al login para forzar un token fresco.
export default function Logout() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    authStore.set(null);
    queryClient.clear();
    setDone(true);
  }, []);

  if (done) return <Redirect href="/login" />;

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator />
    </View>
  );
}
