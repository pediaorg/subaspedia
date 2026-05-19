import { Stack } from "expo-router";
import { Check, Info, Star, X } from "lucide-react-native";
import type * as React from "react";
import { ScrollView, View } from "react-native";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";

const CATEGORIES = [
  { name: "Común", enabled: true },
  { name: "Especial", enabled: true },
  { name: "Plata", enabled: true },
  { name: "Oro", enabled: true },
  { name: "Platino", enabled: false },
];

function CategoryItem({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <View className="flex flex-row items-center gap-1">
      {enabled ? (
        <Check size={18} className="text-green-600" />
      ) : (
        <X size={18} className="text-red-500" />
      )}
      <Text className="text-base">{name}</Text>
    </View>
  );
}

export default function Notifications() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="h1" className="text-left font-bold">
          Notificaciones
        </Text>
        <Separator className="bg-[#D9D9D9]" />
        <Card className="bg-white drop-shadow-md/40 border-none flex-col">
          <CardHeader className="flex-row place-items-center gap-5">
            {" "}
            <img
              src="https://cdn-icons-png.flaticon.com/512/190/190411.png"
              alt="Notificación"
              className="w-10 h-10 rounded-full"
            />
            <CardTitle className="text-xl text-left font-bold">
              <Text className="text-xl text-left font-bold">
                Método de pago...
              </Text>
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <View>
              <View className="flex flex-col gap-4">
                <Text className="text-sm text-left">
                  Le comunicamos que su método de pago ha sido actualizado.
                </Text>
                <Text className="text-sm text-right">16/04/2026</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </>
  );
}
