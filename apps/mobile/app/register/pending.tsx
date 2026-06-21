import { router } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export default function PendingScreen() {
  return (
    <View className="flex-1 justify-center gap-5 bg-white p-6">
      <Text variant="h2" className="text-center font-bold">
        ¡Listo!
      </Text>
      <Text className="text-muted-foreground text-center text-sm">
        Verificamos tu email. Ahora vamos a revisar tus datos y, cuando
        aprobemos tu cuenta, te enviaremos un mail con un link para crear tu
        contraseña e ingresar.
      </Text>

      <Button
        size="lg"
        onPress={() => router.replace("/login")}
        className="bg-accent-foreground rounded-2xl border-0 py-4 shadow-none"
      >
        <Text className="text-base font-bold text-white">Volver al inicio</Text>
      </Button>
    </View>
  );
}
