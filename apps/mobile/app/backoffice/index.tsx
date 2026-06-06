import { useState } from "react";
import { ActivityIndicator, Image, ScrollView, View } from "react-native";

import { type AuctionCategory, PRODUCT_CATEGORIES } from "@subaspedia/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

// Pantalla interna de la empresa (no forma parte de la app del usuario). Sirve
// para disparar a mano los procesos asíncronos del enunciado: la investigación
// que asigna categoría a un postor y la validación de medios de pago. Es
// deliberadamente simple, solo para la demo.
export default function BackofficeScreen() {
  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerClassName="p-4 gap-8"
    >
      <Text variant="h1" className="font-bold">
        Backoffice
      </Text>

      <PendingClientsSection />
      <PendingPaymentsSection />
    </ScrollView>
  );
}

// --- Paso 2: asignar categoría tras la investigación ---
function PendingClientsSection() {
  const pending = api.backoffice.pendingClients.useQuery();
  const assign = api.backoffice.assignCategory.useMutation({
    onSuccess: () => pending.refetch(),
  });

  return (
    <View className="gap-3">
      <Text variant="h3" className="font-semibold">
        Postores a investigar
      </Text>
      <Text className="text-muted-foreground text-sm">
        Asigná una categoría para admitir al postor.
      </Text>

      {pending.isLoading && <ActivityIndicator />}
      {pending.error && (
        <Text className="text-red-500">Error: {pending.error.message}</Text>
      )}
      {!pending.isLoading && pending.data?.length === 0 && (
        <Text className="text-gray-400">No hay postores pendientes</Text>
      )}

      {pending.data?.map(person => (
        <View
          key={person.id}
          className="border-border gap-2 rounded-xl border p-3"
        >
          <Text className="font-semibold">{person.name ?? "Sin nombre"}</Text>
          <Text className="text-muted-foreground text-sm">{person.email}</Text>
          <View className="mt-1 flex-row flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map(cat => (
              <CategoryButton
                key={cat.value}
                label={cat.label}
                disabled={assign.isPending}
                onPress={() =>
                  assign.mutate({
                    personId: person.id,
                    category: cat.value as AuctionCategory,
                  })
                }
              />
            ))}
          </View>
        </View>
      ))}
      {assign.error && (
        <Text className="text-red-500">{assign.error.message}</Text>
      )}
    </View>
  );
}

function CategoryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled}
      onPress={onPress}
      className="rounded-full"
    >
      <Text className="text-sm font-medium">{label}</Text>
    </Button>
  );
}

// --- Paso 5: validar medios de pago fijando el monto garantizado ---
function PendingPaymentsSection() {
  const pending = api.backoffice.pendingPaymentMethods.useQuery();

  return (
    <View className="gap-3">
      <Text variant="h3" className="font-semibold">
        Medios de pago a validar
      </Text>
      <Text className="text-muted-foreground text-sm">
        Al aceptar, fijás el monto garantizado. La suma de los montos
        verificados es el límite de compra del cliente.
      </Text>

      {pending.isLoading && <ActivityIndicator />}
      {pending.error && (
        <Text className="text-red-500">Error: {pending.error.message}</Text>
      )}
      {!pending.isLoading && pending.data?.length === 0 && (
        <Text className="text-gray-400">No hay medios de pago pendientes</Text>
      )}

      {pending.data?.map(pm => (
        <PaymentRow
          key={pm.id}
          id={pm.id}
          type={pm.type}
          details={pm.details}
          photo={pm.photo}
          clientName={pm.clientName}
          onAccepted={() => pending.refetch()}
        />
      ))}
    </View>
  );
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  bank_account: "Cuenta bancaria",
  credit_card: "Tarjeta de crédito",
  certified_check: "Cheque certificado",
};

function PaymentRow({
  id,
  type,
  details,
  photo,
  clientName,
  onAccepted,
}: {
  id: number;
  type: string;
  details: string | null;
  photo: string | null;
  clientName: string | null;
  onAccepted: () => void;
}) {
  const [amount, setAmount] = useState("");
  const accept = api.backoffice.acceptPaymentMethod.useMutation({
    onSuccess: onAccepted,
  });

  const parsed = Number(amount);
  const valid = amount.length > 0 && Number.isFinite(parsed) && parsed > 0;

  return (
    <View className="border-border gap-2 rounded-xl border p-3">
      <Text className="font-semibold">{clientName ?? "Cliente"}</Text>
      <Text className="text-muted-foreground text-sm">
        {PAYMENT_TYPE_LABELS[type] ?? type}
      </Text>
      {details && <Text className="text-sm">{details}</Text>}
      {photo && (
        <Image
          source={{ uri: photo }}
          className="h-40 w-full rounded-lg"
          resizeMode="cover"
        />
      )}
      <View className="mt-1 flex-row items-center gap-2">
        <Input
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Monto garantizado"
          className="bg-secondary flex-1 border-none"
        />
        <Button
          size="sm"
          disabled={!valid || accept.isPending}
          onPress={() => accept.mutate({ paymentMethodId: id, amount: parsed })}
        >
          <Text className="text-sm font-semibold text-white">
            {accept.isPending ? "..." : "Aceptar"}
          </Text>
        </Button>
      </View>
      {accept.error && (
        <Text className="text-red-500 text-sm">{accept.error.message}</Text>
      )}
    </View>
  );
}
