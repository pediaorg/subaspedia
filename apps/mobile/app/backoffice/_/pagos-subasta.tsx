import { View } from "react-native";

import type { Currency } from "@subaspedia/types";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

import { Card, QueryState, SectionHeader } from "./shared";

// Aprobación del pago de una compra ganada. El ganador ya apretó "Pagar" (la
// compra quedó 'pending'); acá la empresa simula aceptarlo o rechazarlo. Aceptar
// deja la compra pagada/retirada; rechazar le emite al comprador una multa
// automática (falta de pago, 10% de lo ofertado).
export function PagosSubastaSection() {
  const pending = api.backoffice.pendingSalePayments.useQuery();

  return (
    <View className="gap-3">
      <SectionHeader
        title="Pagos de subasta a aprobar"
        hint="Al rechazar, se le emite al comprador una multa automática por falta de pago (10% de lo ofertado)."
      />
      <QueryState
        isLoading={pending.isLoading}
        error={pending.error}
        empty={pending.data?.length === 0}
        emptyText="No hay pagos pendientes"
      />

      {pending.data?.map(p => (
        <PaymentRow
          key={p.id}
          id={p.id}
          productName={p.productName}
          clientName={p.clientName}
          total={p.total}
          currency={p.currency}
          onResolved={() => pending.refetch()}
        />
      ))}
    </View>
  );
}

function PaymentRow({
  id,
  productName,
  clientName,
  total,
  currency,
  onResolved,
}: {
  id: number;
  productName: string;
  clientName: string;
  total: number;
  currency: Currency;
  onResolved: () => void;
}) {
  const resolve = api.backoffice.resolveSalePayment.useMutation({
    onSuccess: onResolved,
  });

  return (
    <Card>
      <Text className="font-semibold">{clientName || "Cliente"}</Text>
      <Text className="text-muted-foreground text-sm">{productName}</Text>
      <Text className="text-sm">{formatMoney(total, currency)}</Text>
      <View className="mt-1 flex-row gap-2">
        <Button
          size="sm"
          disabled={resolve.isPending}
          onPress={() => resolve.mutate({ id, decision: "accepted" })}
        >
          <Text className="text-sm font-semibold text-white">
            {resolve.isPending ? "..." : "Aceptar"}
          </Text>
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={resolve.isPending}
          onPress={() => resolve.mutate({ id, decision: "rejected" })}
        >
          <Text className="text-sm font-semibold text-white">Rechazar</Text>
        </Button>
      </View>
      {resolve.error && (
        <Text className="text-red-500 text-sm">{resolve.error.message}</Text>
      )}
    </Card>
  );
}
