import { router, usePathname } from "expo-router";
import { Hand } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

interface LoginPromptProps {
  message: ReactNode;
}

export function LoginPrompt({ message }: LoginPromptProps) {
  const pathname = usePathname();

  // Lleva la ruta actual como `redirect` para volver acá una vez logueado.
  const goToLogin = () =>
    router.push({ pathname: "/login", params: { redirect: pathname } });

  return (
    <Card className="bg-card drop-shadow-md/40 border-none">
      <CardContent className="items-center gap-4 py-8">
        <View className="bg-primary h-20 w-20 items-center justify-center rounded-full">
          <Hand size={36} className="text-primary-foreground" />
        </View>
        <Text className="text-muted-foreground text-center text-lg">
          {message}
        </Text>
        <Button
          size="lg"
          onPress={goToLogin}
          className="bg-accent-foreground mt-2 self-center rounded-full border-0 px-10 py-4 shadow-none"
        >
          <Text className="text-base font-bold text-white">Iniciar sesión</Text>
        </Button>
      </CardContent>
    </Card>
  );
}
