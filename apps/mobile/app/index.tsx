import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { Text } from "@/components/ui/text";

const SPLASH_DURATION_MS = 3500;

export default function Splash() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/(tabs)");
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={["#1f8edd", "#0e3f8e"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <Image
            source={require("@/assets/images/splash.png")}
            style={{ width: 230, height: 255 }}
            contentFit="contain"
          />
        </View>
        <View className="items-center pb-16">
          <Text className="text-center text-base text-white/90">
            Una aplicación
          </Text>
          <Text className="text-center text-base text-white/90">de UADE</Text>
        </View>
      </LinearGradient>
    </>
  );
}
