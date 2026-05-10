import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="products" />
      <Stack.Screen name="auctions" />
      <Stack.Screen name="infractions" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
