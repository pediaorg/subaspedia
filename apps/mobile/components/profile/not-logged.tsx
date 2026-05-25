import { Link } from "expo-router";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authStore } from "@/lib/auth";

export function NotLoggedProfile() {
  return (
    <View className="flex-1 px-5 justify-center gap-6">
      <Card className="border-0 drop-shadow-2xl/10 p-6 gap-4 items-center">
        <View className="gap-2">
          <Text className="text-center text-xl font-bold">
            Necesitás una cuenta
          </Text>
          <Text className="text-center text-gray-500">
            Iniciá sesión o registrate para ver tu perfil, gestionar tus
            productos y participar en subastas.
          </Text>
        </View>

        <View className="w-full gap-3 mt-2">
          {/* Login: pantalla existente. Ambos botones apuntan a /login porque
              login.tsx ya alterna entre login/register internamente. */}
          <Link href="/login" asChild>
            <Button variant="outline" className="rounded-xl w-full">
              <Text className="font-bold">Iniciar sesión</Text>
            </Button>
          </Link>
          <Link href="/login" asChild>
            <Button className="rounded-xl w-full">
              <Text className="font-bold text-white">Registrarse</Text>
            </Button>
          </Link>
        </View>
      </Card>

      {/* Escape hatch para dev: en builds de desarrollo, un toque entra
          como usuario de prueba (setea un token mock en authStore).
          __DEV__ es false en producción, así que esto desaparece del bundle. */}
      {__DEV__ && (
        <View className="items-center">
          <Button
            variant="ghost"
            onPress={() => authStore.set({ accessToken: "dev-mock-token" })}
          >
            <Text className="text-gray-400 text-sm">
              [dev] Entrar como usuario de prueba
            </Text>
          </Button>
        </View>
      )}
    </View>
  );
}
