import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";

import type { Product } from "@subaspedia/types/product";
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

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const MOCK_PRODUCT: Product = {
  id: 1,
  name: "Reloj de bolsillo siglo XIX",
  status: "appraised",
  img: "https://picsum.photos/seed/reloj/200",
  proposalText:
    "Pieza en muy buen estado de conservación. Tasada para incluir en la próxima subasta de antigüedades.",
  proposedBasePrice: 180000,
  proposedCommission: 12,
  salePrice: null,
  currency: null,
  saleDate: null,
  auctionId: null,
};

export default function ProposalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const queryClient = useQueryClient();
  const { data: product, isLoading } = useQuery({
    queryKey: ["products", productId],
    queryFn: async () => {
      // TODO: reemplazar por la llamada real al back (GET /products/{id})
      await new Promise(r => setTimeout(r, 300));
      return MOCK_PRODUCT;
    },
  });
  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: async (vars: {
      productId: number;
      newStatus: "approved" | "rejected";
    }) => {
      // TODO: reemplazar por la llamada real al back (PUT /products/{id}/status)
      await new Promise(r => setTimeout(r, 300));
      return vars.newStatus;
    },
    onSuccess: () => {
      // refrescamos detalle y lista para que reflejen el nuevo estado
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
    </View>
  );
}
