import { Stack, usePathname } from "expo-router";
import { View } from "react-native";

import ProfileHeader from "@/components/profile/profile-header";

export default function ProfileLayout() {
  const pathname = usePathname();
  // El alta de medio de pago trae su propio header limpio; el resto del
  // perfil usa el ProfileHeader compartido.
  const hideHeader = pathname === "/profile/payment-methods/new";

  return (
    <View className="flex-1">
      {!hideHeader && <ProfileHeader />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="edit" />
        <Stack.Screen name="products" />
        <Stack.Screen name="stats" />
        <Stack.Screen name="infractions" />
        <Stack.Screen name="payment-methods/index" />
        <Stack.Screen
          name="payment-methods/new"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>
    </View>
  );
}
