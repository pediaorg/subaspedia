import { useState } from "react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

import { Card, QueryState, SectionHeader } from "./shared";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  bank_account: "Cuenta bancaria",
  credit_card: "Tarjeta de crédito",
  certified_check: "Cheque certificado",
};

// Paso 5 del flujo: validar medios de pago fijando el monto garantizado.
export function PagosSection() {
  const pending = api.backoffice.pendingPaymentMethods.useQuery();

  return (
    <View className="gap-3">
      <SectionHeader
        title="Medios de pago a validar"
        hint="Al aceptar, fijás el monto garantizado. La suma de los montos verificados es el límite de compra del cliente."
      />
      <QueryState
        isLoading={pending.isLoading}
        error={pending.error}
        empty={pending.data?.length === 0}
        emptyText="No hay medios de pago pendientes"
      />

      {pending.data?.map(pm => (
        <PaymentRow
          key={pm.id}
          id={pm.id}
          clientId={pm.clientId}
          type={pm.type}
          details={pm.details}
          clientName={pm.clientName}
          onAccepted={() => pending.refetch()}
        />
      ))}
    </View>
  );
}

function PaymentRow({
  id,
  clientId,
  type,
  details,
  clientName,
  onAccepted,
}: {
  id: number;
  type: string;
  details: string | null;
  clientName: string | null;
  clientId: number;
  onAccepted: () => void;
}) {
  const [amount, setAmount] = useState("");
  const notify = api.notifications.create.useMutation();
  const accept = api.backoffice.acceptPaymentMethod.useMutation({
    onSuccess: async (_, variables) => {
      // Usamos variables.amount para asegurar el número exacto que se guardó
      await notify.mutateAsync({
        clientId: clientId,
        title: "Medio de pago verificado",
        body: `Tu garantía ha sido aprobada. Tienes un nuevo límite de compra de $${variables.amount}.`,
        route: "paymentMethod",
      });

      onAccepted();
    },
  });

  const parsed = Number(amount);
  const valid = amount.length > 0 && Number.isFinite(parsed) && parsed > 0;

  return (
    <Card>
      <Text className="font-semibold">{clientName ?? "Cliente"}</Text>
      <Text className="text-muted-foreground text-sm">
        {PAYMENT_TYPE_LABELS[type] ?? type}
      </Text>
      {details && <Text className="text-sm">{details}</Text>}
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
          disabled={!valid || accept.isPending || notify.isPending}
          onPress={() => accept.mutate({ paymentMethodId: id, amount: parsed })}
        >
          <Text className="text-sm font-semibold text-white">
            {accept.isPending || notify.isPending ? "..." : "Aceptar"}
          </Text>
        </Button>
      </View>
      {accept.error && (
        <Text className="text-red-500 text-sm">{accept.error.message}</Text>
      )}
    </Card>
  );
}
