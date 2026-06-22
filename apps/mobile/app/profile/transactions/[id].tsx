import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Check, MapPin, Store, Truck } from "lucide-react-native";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import type { DeliveryMethod } from "@subaspedia/types";
import OrderStatusBadge from "@/components/profile/transactions/order-status-badge";
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
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

// Una fila del desglose de la factura (etiqueta a la izquierda, monto a la
// derecha). `bold` para el total.
function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text
        className={bold ? "font-bold text-gray-900 text-base" : "text-gray-700"}
      >
        {label}
      </Text>
      <Text
        className={bold ? "font-bold text-primary text-base" : "text-gray-800"}
      >
        {value}
      </Text>
    </View>
  );
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const transactionId = Number(id);
  const isValidId = Number.isInteger(transactionId) && transactionId > 0;
  const queryClient = useQueryClient();

  const { data: tx, isLoading } = api.user.transactionById.useQuery(
    { id: isValidId ? transactionId : 0 },
    { enabled: isValidId },
  );

  const { mutate: setDelivery, isPending } = api.user.setDelivery.useMutation({
    onSuccess: () => {
      // El back es la fuente de verdad: refrescamos la lista de pagos (el total
      // cambia según envío/retiro) y este mismo detalle.
      queryClient.invalidateQueries({
        queryKey: api.user.transactions.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: api.user.transactionById.queryKey({
          input: { id: transactionId },
        }),
      });
    },
    onError: error =>
      Alert.alert(
        "No se pudo actualizar la entrega",
        error.message || "Intentá de nuevo más tarde.",
      ),
  });

  if (isLoading) {
    return (
      <View className="flex-1 px-4">
        <Text className="text-gray-500">Cargando compra…</Text>
      </View>
    );
  }

  if (!tx) {
    return (
      <View className="flex-1 px-4 gap-2">
        <Text className="font-bold text-2xl">Compra no encontrada</Text>
        <Text className="text-gray-500">
          No pudimos encontrar el detalle de esta compra.
        </Text>
      </View>
    );
  }

  const isPickup = tx.deliveryMethod === "pickup";

  // No es destructivo elegir envío -> mutación directa. Retiro pasa por la
  // confirmación del seguro (AlertDialog) antes de llamar acá.
  const choose = (method: DeliveryMethod) => {
    if (isPending || method === tx.deliveryMethod) return;
    setDelivery({ id: transactionId, deliveryMethod: method });
  };

  return (
    <View className="flex-1 px-4 gap-5">
      <View className="gap-4">
        <Text className="font-bold text-3xl">Detalle de compra</Text>
        <Separator className="bg-gray-500" />
      </View>

      <ScrollView contentContainerClassName="pb-8 gap-4">
        {/* Producto */}
        <Card className="border-0 p-4 drop-shadow-2xl/10 flex-row items-center gap-3">
          <Avatar alt={tx.productName} className="size-16 rounded-full">
            <AvatarImage source={{ uri: tx.img }} />
          </Avatar>
          <View className="flex-1">
            <Text className="font-bold text-lg" numberOfLines={2}>
              {tx.productName}
            </Text>
            <OrderStatusBadge status={tx.status} />
          </View>
        </Card>

        {/* Factura: el importe que la consigna manda informar al ganador
            (lo pujado + comisiones + costo de envío a la dirección declarada). */}
        <Card className="border-0 p-4 drop-shadow-2xl/10 gap-3">
          <Text className="font-bold text-lg">Factura</Text>
          <View className="gap-2">
            <Row label="Puja" value={formatMoney(tx.bidAmount, tx.currency)} />
            <Row
              label="Comisiones"
              value={formatMoney(tx.commissionAmount, tx.currency)}
            />
            {!isPickup && (
              <Row
                label="Envío"
                value={formatMoney(tx.shippingCost, tx.currency)}
              />
            )}
          </View>
          <Separator className="bg-gray-300" />
          <Row label="Total" value={formatMoney(tx.total, tx.currency)} bold />
        </Card>

        {/* Entrega: envío a la dirección declarada (default) o retiro personal
            (que pierde el seguro). */}
        <Card className="border-0 p-4 drop-shadow-2xl/10 gap-3">
          <Text className="font-bold text-lg">Entrega</Text>

          {!isPickup && tx.shippingAddress && (
            <View className="flex-row items-start gap-2">
              <Icon as={MapPin} size={18} className="text-gray-500 mt-0.5" />
              <Text className="flex-1 text-sm text-gray-700">
                {tx.shippingAddress}
              </Text>
            </View>
          )}

          <View className="gap-3">
            {/* Envío a domicilio */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Elegir envío a domicilio"
              onPress={() => choose("shipping")}
              disabled={isPending}
              className={`flex-row items-center gap-3 rounded-2xl px-4 py-3 active:opacity-70 ${
                isPickup
                  ? "bg-white drop-shadow-md/20"
                  : "bg-primary/10 border border-primary"
              }`}
            >
              <Icon
                as={Truck}
                size={26}
                className={isPickup ? "text-gray-500" : "text-primary"}
              />
              <View className="flex-1">
                <Text className="font-bold text-sm text-gray-800">
                  Envío a domicilio
                </Text>
                <Text className="text-xs text-gray-600">
                  A la dirección declarada
                </Text>
              </View>
              {!isPickup && (
                <Icon as={Check} size={20} className="text-primary" />
              )}
            </Pressable>

            {/* Retiro personal: confirma la pérdida del seguro antes de cambiar. */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Elegir retiro personal"
                  disabled={isPending}
                  className={`flex-row items-center gap-3 rounded-2xl px-4 py-3 active:opacity-70 ${
                    isPickup
                      ? "bg-primary/10 border border-primary"
                      : "bg-white drop-shadow-md/20"
                  }`}
                >
                  <Icon
                    as={Store}
                    size={26}
                    className={isPickup ? "text-primary" : "text-gray-500"}
                  />
                  <View className="flex-1">
                    <Text className="font-bold text-sm text-gray-800">
                      Retiro personal
                    </Text>
                    <Text className="text-xs text-gray-600">
                      Sin costo de envío · perdés el seguro
                    </Text>
                  </View>
                  {isPickup && (
                    <Icon as={Check} size={20} className="text-primary" />
                  )}
                </Pressable>
              </AlertDialogTrigger>
              <AlertDialogContent
                className="bg-primary-foreground"
                overlayClassName="backdrop-blur-md bg-black/30"
              >
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Retirar personalmente?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-700">
                    Si retirás el bien en persona, una vez retirado pierde la
                    cobertura del seguro. No se cobra costo de envío.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    <Text>Cancelar</Text>
                  </AlertDialogCancel>
                  <AlertDialogAction onPress={() => choose("pickup")}>
                    <Text className="font-bold text-white">Sí, retirar</Text>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}
