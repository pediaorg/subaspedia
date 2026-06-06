import { ActivityIndicator, View } from "react-native";

export function RequireSession() {
  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-white">
      <ActivityIndicator size="large" />
    </View>
  );
}
