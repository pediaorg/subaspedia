import { Redirect, Tabs } from "expo-router";

import { useAuth } from "@/lib/auth";

export default function TabLayout() {
  const { isAuthed } = useAuth();
  if (!isAuthed) return <Redirect href="/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
    </Tabs>
  );
}
