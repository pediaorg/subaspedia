import { Stack } from "expo-router";
import { Check, Info, Star, X } from "lucide-react-native";
import type * as React from "react";
import { ScrollView, View } from "react-native";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
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

export default function Rank() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="h1" className="text-left font-bold">
          Rango
        </Text>
        <Separator className="bg-[#D9D9D9]" />
        <Card className="bg-white drop-shadow-md/40 border-none">
          <CardContent className="gap-4 pt-1">
            <View className="gap-1">
              <Text className="text-2xl text-left font-bold">Tu categoría</Text>
              <View className="flex flex-row items-center gap-2">
                <Star size={20} className="text-yellow-400 fill-yellow-400" />
                <Text className="text-lg text-left font-bold">ORO</Text>
              </View>
            </View>

            <Separator className="bg-[#D9D9D9]" />

            <View className="gap-2">
              <Text className="text-2xl text-left font-bold">
                Podés participar en
              </Text>
              <View className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
                {CATEGORIES.map(c => (
                  <CategoryItem
                    key={c.name}
                    name={c.name}
                    enabled={c.enabled}
                  />
                ))}
              </View>
            </View>

            <Separator className="bg-[#D9D9D9]" />

            <View className="gap-1">
              <Text className="text-2xl text-left font-bold">
                Cómo mejorar tu categoría
              </Text>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base font-semibold">
                  Medios de pagos registrados: [3/5]
                </Text>
              </View>
              <Text className="text-sm text-blue-600 underline text-center mt-1">
                Ver/Agregar medio de pago
              </Text>
            </View>

            <View className="gap-1">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-base text-left font-semibold">
                  Actividad
                </Text>
                <Text className="text-sm text-blue-600 underline">
                  Ver historial de subastas
                </Text>
              </View>
              <View className="pl-4 gap-0.5">
                <Text className="text-base">• 12 Subastas participadas</Text>
                <Text className="text-base">• 3 Ganadas</Text>
                <Text className="text-base">• $ 450.000 ofertados</Text>
              </View>
            </View>

            <Separator className="bg-[#D9D9D9]" />

            <View className="bg-[#748EA2] drop-shadow-md/40 flex-row items-center gap-2 rounded-lg p-1">
              <Alert
                icon={Info}
                iconClassName="text-white"
                className="border-none items-center"
              >
                <AlertTitle className="text-white">
                  La empresa actualiza tu categoría según tu actividad y
                  diversidad de pagos
                </AlertTitle>
              </Alert>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </>
  );
}
