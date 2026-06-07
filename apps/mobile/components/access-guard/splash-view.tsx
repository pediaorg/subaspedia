import { LinearGradient } from "expo-linear-gradient";
import { Image, View } from "react-native";

import { Text } from "@/components/ui/text";

import { SPLASH_IMAGE_URI } from "./splash-image";

// Vista del splash reutilizable: se usa tanto en la pantalla inicial
// (app/index.tsx) como en los guards mientras la sesión se hidrata/refresca.
// El logo va embebido como data URI (ver splash-image.ts) porque el dev server
// de Metro servía el asset recién después de la primera query.
export function SplashView() {
  return (
    <LinearGradient
      colors={["#1f8edd", "#0e3f8e"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1 items-center justify-center">
        <Image
          source={{ uri: SPLASH_IMAGE_URI }}
          style={{ width: 230, height: 255 }}
          resizeMode="contain"
          fadeDuration={0}
        />
      </View>
      <View className="items-center pb-16">
        <Text className="text-center text-base text-white/90">
          Una aplicación
        </Text>
        <Text className="text-center text-base text-white/90">de UADE</Text>
      </View>
    </LinearGradient>
  );
}
