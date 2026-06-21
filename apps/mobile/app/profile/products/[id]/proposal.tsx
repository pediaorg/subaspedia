import { useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

export default function ProposalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const isValidId = Number.isInteger(productId) && productId > 0;
  const queryClient = useQueryClient();
  const { data: product, isLoading } = api.products.getById.useQuery(
    { id: isValidId ? productId : 0 },
    { enabled: isValidId },
  );
  const { mutate: updateStatus, isPending } =
    api.products.updateStatus.useMutation({
      // Tras aceptar/rechazar refrescamos "Mis productos" para que refleje el
      // nuevo estado al volver.
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: api.products.list.queryKey(),
        });
      },
    });

  if (isLoading) {
    return (
      <View className="flex-1 px-4">
        <Text className="text-gray-500">Cargando propuesta…</Text>
      </View>
    );
  }

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

  // La pantalla sirve dos estados: "appraised" (propuesta a aceptar/rechazar) y
  // "rejected" (solo lectura: el dueño ve el motivo del rechazo). Cualquier otro
  // estado no tiene detalle de cotización que mostrar.
  if (product.status !== "appraised" && product.status !== "rejected") {
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

  const isRejected = product.status === "rejected";

  const updateAndGoBack = (status: "approved" | "rejected") => {
    updateStatus(
      { id: productId, status },
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
        <Text className="font-bold text-3xl">
          {isRejected ? "Motivo del rechazo" : "Propuesta"}
        </Text>
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
                  {formatMoney(product.proposedBasePrice, "ARS")}
                </Text>
              </View>
            )}
            {product.proposedCommission !== null && (
              <View className="flex-row justify-between items-center">
                <Text className="font-bold text-gray-700">Comisión</Text>
                <Text className="font-bold text-primary text-base">
                  {formatMoney(product.proposedCommission, "ARS")}
                </Text>
              </View>
            )}
          </View>

          <Text className="text-xs text-gray-500 text-center">
            {isRejected
              ? "Este producto fue rechazado y no se incluirá en ninguna subasta."
              : "Si aceptás la propuesta el producto pasará al estado “Aprobado”. Si la rechazás, pasará al estado “Rechazado” y no se incluirá en ninguna subasta."}
          </Text>
        </Card>
      </ScrollView>

      {!isRejected && (
        <View className="flex-row gap-3 pb-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={isPending}
                className="flex-1 rounded-xl"
              >
                <Text className="font-bold text-white">
                  {isPending ? "..." : "Rechazar"}
                </Text>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              className="bg-primary-foreground"
              overlayClassName="backdrop-blur-md bg-black/30"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>¿Rechazar la propuesta?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-700">
                  El producto pasará al estado “Rechazado” y no se incluirá en
                  ninguna subasta. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Text>Cancelar</Text>
                </AlertDialogCancel>
                <AlertDialogAction
                  onPress={handleReject}
                  className={buttonVariants({ variant: "destructive" })}
                >
                  <Text className="font-bold text-white">Sí, rechazar</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isPending} className="flex-1 rounded-xl">
                <Text className="font-bold text-white">
                  {isPending ? "..." : "Aceptar"}
                </Text>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent
              className="bg-primary-foreground"
              overlayClassName="backdrop-blur-md bg-black/30"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>¿Aceptar la propuesta?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-700">
                  El producto pasará al estado “Aprobado” y será incluido en una
                  subasta futura con el valor base y la comisión propuestos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Text>Cancelar</Text>
                </AlertDialogCancel>
                <AlertDialogAction onPress={handleAccept}>
                  <Text className="font-bold text-white">Sí, aceptar</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </View>
      )}
    </View>
  );
}
