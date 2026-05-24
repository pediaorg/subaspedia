import { router, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMyProducts, useUpdateProductStatus } from "@/hooks/use-my-products";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function ProposalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const { data: products, isLoading } = useMyProducts();
  const { mutate: updateStatus, isPending } = useUpdateProductStatus();

  if (isLoading) {
    return (
      <View className="flex-1 px-4">
        <Text className="text-gray-500">Cargando propuesta…</Text>
      </View>
    );
  }

  const product = products?.find(p => p.id === productId);

  if (!product) {
    return (
      <View className="flex-1 px-4 gap-2">
        <Text className="font-bold text-2xl">Propuesta no encontrada</Text>
        <Text className="text-gray-500">
          No pudimos encontrar el producto solicitado.
        </Text>
      </View>
    );
  }

  if (product.status !== "appraised") {
    return (
      <View className="flex-1 px-4 gap-2">
        <Text className="font-bold text-2xl">
          La propuesta ya no está disponible
        </Text>
        <Text className="text-gray-500">
          Este producto se encuentra en un estado posterior al de propuesta.
        </Text>
      </View>
    );
  }

  const updateAndGoBack = (newStatus: "approved" | "rejected") => {
    updateStatus(
      { productId, newStatus },
      {
        onSuccess: () => router.back(),
        onError: error => Alert.alert("Error", error.message),
      },
    );
  };

  const handleAccept = () => updateAndGoBack("approved");
  const handleReject = () => updateAndGoBack("rejected");

  return (
    <View className="flex-1 px-4 gap-5">
      <View className="gap-4">
        <Text className="font-bold text-3xl">Propuesta</Text>
        <Separator className="bg-gray-500" />
      </View>

      <ScrollView contentContainerClassName="pb-4 gap-4">
        <Card className="border-0 p-4 drop-shadow-2xl/10 gap-4">
          <View className="flex-row items-center gap-3">
            <Avatar alt={product.name} className="size-16 rounded-full">
              <AvatarImage source={{ uri: product.img }} />
            </Avatar>
            <View className="flex-1">
              <Text className="font-bold text-lg" numberOfLines={2}>
                {product.name}
              </Text>
              <Text className="text-sm text-gray-500">{product.category}</Text>
            </View>
          </View>

          <Separator className="bg-gray-300" />

          {product.proposalText && (
            <Text className="text-sm text-gray-700 leading-5">
              {product.proposalText}
            </Text>
          )}

          <View className="bg-secondary rounded-xl p-4 gap-2">
            {product.proposedBasePrice !== null && (
              <View className="flex-row justify-between items-center">
                <Text className="font-bold text-gray-700">
                  Valor base sugerido
                </Text>
                <Text className="font-bold text-primary text-base">
                  {currencyFormatter.format(product.proposedBasePrice)}
                </Text>
              </View>
            )}
            {product.proposedCommission !== null && (
              <View className="flex-row justify-between items-center">
                <Text className="font-bold text-gray-700">Comisión</Text>
                <Text className="font-bold text-primary text-base">
                  {product.proposedCommission}%
                </Text>
              </View>
            )}
          </View>

          <Text className="text-xs text-gray-500 text-center">
            Si aceptás la propuesta el producto pasará al estado “Aprobado”. Si
            la rechazás, pasará al estado “Rechazado” y no se incluirá en
            ninguna subasta.
          </Text>
        </Card>
      </ScrollView>

      <View className="flex-row gap-3 pb-6">
        <Button
          variant="destructive"
          disabled={isPending}
          onPress={handleReject}
          className="flex-1 rounded-xl"
        >
          <Text className="font-bold text-white">
            {isPending ? "..." : "Rechazar"}
          </Text>
        </Button>
        <Button
          disabled={isPending}
          onPress={handleAccept}
          className="flex-1 rounded-xl"
        >
          <Text className="font-bold text-white">
            {isPending ? "..." : "Aceptar"}
          </Text>
        </Button>
      </View>
    </View>
  );
}
