import { View } from "react-native";

import { SplashView } from "./splash-view";

export function RequireSession() {
  return (
    <View className="absolute inset-0 z-50">
      <SplashView />
    </View>
  );
}
