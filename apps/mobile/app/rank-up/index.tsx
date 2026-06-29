import { Stack } from "expo-router";
import { ScrollView, View } from "react-native";

import { BackButton } from "@/components/app-header/back-button";
import { MenuButton } from "@/components/app-header/menu-button";
import { LoginPrompt } from "@/components/login-prompt";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth";

import { RankSummary } from "./_/rank-summary";

export default function RankUp() {
  const { isAuthed } = useAuth();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-32"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <BackButton />
            <Text variant="h3" className="text-left font-bold">
              Rango
            </Text>
          </View>
          <MenuButton />
        </View>
        <Separator className="bg-border" />
        {isAuthed ? (
          <RankSummary />
        ) : (
          <LoginPrompt
            message={
              <>
                Para poder ver su rango, por favor{" "}
                <Text className="text-foreground text-lg font-bold">
                  inicie sesión
                </Text>
              </>
            }
          />
        )}
      </ScrollView>
    </>
  );
}
