import { Stack } from "expo-router";
import { View } from "react-native";

import ProfileHeader from "@/components/profile/profile-header";

export default function ProfileLayout() {
  return (
    <View className="flex-1">
      <ProfileHeader />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="edit" />
        <Stack.Screen name="products" />
        <Stack.Screen name="auctions" />
        <Stack.Screen name="infractions" />
        <Stack.Screen name="payment-methods" />
      </Stack>
    </View>
  );
}
