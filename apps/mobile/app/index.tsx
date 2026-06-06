import { router, Stack } from "expo-router";
import { useEffect } from "react";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { SplashView } from "@/components/access-guard/splash-view";
import { useAuth } from "@/lib/auth";

export default function Splash() {
  const { loading } = useAuth();
  const opacity = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, flex: 1 }));

  // Arranca visible (sin fade-in). Cuando la sesión termina de cargar, se
  // mantiene un momento y hace fade-out; recién ahí navega. Se usa opacity
  // animada y no FadeOut de layout porque en web es lo único que reanimated corre.
  useEffect(() => {
    if (loading) return;
    opacity.value = withDelay(
      500,
      withTiming(0, { duration: 350 }, finished => {
        if (finished) runOnJS(router.replace)("/(tabs)");
      }),
    );
  }, [loading]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Animated.View style={style}>
        <SplashView />
      </Animated.View>
    </>
  );
}
