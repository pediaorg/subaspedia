import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { BackButton } from "@/components/app-header/back-button";
import { MenuButton } from "@/components/app-header/menu-button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

export default function InsurancesScreen() {
  const { data: insurances, isLoading } = api.user.insurances.useQuery();

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-24 gap-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <BackButton />
            <Text className="text-2xl font-bold tracking-tight text-left">
              Seguros
            </Text>
          </View>
          <MenuButton />
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" />
          </View>
        ) : !insurances || insurances.length === 0 ? (
          <View className="flex-1 gap-2 mt-4">
            <Text className="font-bold text-2xl">Sin seguros activos</Text>
            <Text className="text-gray-500">
              No tienes productos con pólizas de seguro activas en este momento.
            </Text>
          </View>
        ) : (
          <View className="gap-4 mt-2">
            {insurances.map(insurance => (
              <Card
                key={insurance.productId}
                className="border-0 p-4 drop-shadow-2xl/10 gap-4"
              >
                <View className="flex-row items-center gap-3">
                  <Avatar
                    alt={insurance.productName}
                    className="size-16 rounded-full"
                  >
                    <AvatarImage source={{ uri: insurance.img }} />
                  </Avatar>
                  <View className="flex-1">
                    <Text className="font-bold text-lg" numberOfLines={2}>
                      {insurance.productName}
                    </Text>
                  </View>
                </View>

                <Separator className="bg-gray-300" />

                <View className="bg-secondary rounded-xl p-4 gap-2">
                  <View className="flex-row justify-between items-center">
                    <Text className="font-bold text-gray-700">Compañía</Text>
                    <Text className="font-bold text-gray-900">
                      {insurance.company}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="font-bold text-gray-700">
                      Nº de Póliza
                    </Text>
                    <Text className="font-bold text-gray-900">
                      {insurance.policyNumber}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="font-bold text-gray-700">
                      Suma Asegurada
                    </Text>
                    <Text className="font-bold text-primary text-base">
                      {formatMoney(insurance.amount, "ARS")}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
