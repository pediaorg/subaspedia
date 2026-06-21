import { useState } from "react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

import { Card, QueryState, SectionHeader } from "./shared";

const QUOTE_STATE_LABELS: Record<string, string> = {
  tasado: "Tasado",
  aceptado: "Aceptado",
  rechazado: "Rechazado",
};

// Feature 1: cotización / tasación de bienes (precio base + comisión).
export function CotizacionesSection() {
  const pending = api.backoffice.pendingAppraisals.useQuery();
  const quotes = api.backoffice.listQuotes.useQuery();

  const refetchAll = () => {
    pending.refetch();
    quotes.refetch();
  };

  const propose = api.backoffice.proposeQuote.useMutation({
    onSuccess: refetchAll,
  });
  const confirm = api.backoffice.confirmQuote.useMutation({
    onSuccess: () => quotes.refetch(),
  });
  const reject = api.backoffice.rejectQuote.useMutation({
    onSuccess: () => quotes.refetch(),
  });

  return (
    <View className="gap-6">
      <View className="gap-3">
        <SectionHeader
          title="Bienes a cotizar"
          hint="Proponé un precio base y una comisión para cada bien subido por un usuario."
        />
        <QueryState
          isLoading={pending.isLoading}
          error={pending.error}
          empty={pending.data?.length === 0}
          emptyText="No hay bienes pendientes de cotización"
        />
        {pending.data?.map(p => (
          <AppraisalRow
            key={p.id}
            name={p.name}
            description={p.fullDescription}
            disabled={propose.isPending}
            onPropose={(basePrice, commission) =>
              propose.mutate({ productId: p.id, basePrice, commission })
            }
          />
        ))}
        {propose.error && (
          <Text className="text-red-500 text-sm">{propose.error.message}</Text>
        )}
      </View>

      <View className="gap-3">
        <SectionHeader
          title="Cotizaciones"
          hint="Una vez tasado, el dueño puede aceptar o rechazar el valor base y la comisión."
        />
        <QueryState
          isLoading={quotes.isLoading}
          error={quotes.error}
          empty={quotes.data?.length === 0}
          emptyText="Todavía no hay cotizaciones"
        />
        {quotes.data?.map(q => (
          <Card key={q.id}>
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold">{q.productName}</Text>
              <Text className="text-muted-foreground text-xs">
                {QUOTE_STATE_LABELS[q.state ?? ""] ?? q.state}
              </Text>
            </View>
            <Text className="text-sm">
              Base ${q.basePrice} · Comisión ${q.commission}
            </Text>
            {q.state === "tasado" && (
              <View className="mt-1 flex-row gap-2">
                <Button
                  size="sm"
                  disabled={confirm.isPending}
                  onPress={() => confirm.mutate({ itemId: q.id })}
                >
                  <Text className="text-sm font-semibold text-white">
                    Confirmar
                  </Text>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={reject.isPending}
                  onPress={() => reject.mutate({ itemId: q.id })}
                >
                  <Text className="text-sm font-medium">Rechazar</Text>
                </Button>
              </View>
            )}
          </Card>
        ))}
      </View>
    </View>
  );
}

function AppraisalRow({
  name,
  description,
  disabled,
  onPropose,
}: {
  name: string;
  description: string | null;
  disabled?: boolean;
  onPropose: (basePrice: number, commission: number) => void;
}) {
  const [base, setBase] = useState("");
  const [commission, setCommission] = useState("");

  const basePrice = Number(base);
  const comm = Number(commission);
  const valid =
    base.length > 0 &&
    commission.length > 0 &&
    basePrice > 0 &&
    comm > 0 &&
    Number.isFinite(basePrice) &&
    Number.isFinite(comm);

  return (
    <Card>
      <Text className="font-semibold">{name}</Text>
      {description && (
        <Text className="text-muted-foreground text-sm" numberOfLines={2}>
          {description}
        </Text>
      )}
      <View className="mt-1 flex-row gap-2">
        <Input
          value={base}
          onChangeText={setBase}
          keyboardType="numeric"
          placeholder="Precio base"
          className="bg-secondary flex-1 border-none"
        />
        <Input
          value={commission}
          onChangeText={setCommission}
          keyboardType="numeric"
          placeholder="Comisión"
          className="bg-secondary flex-1 border-none"
        />
      </View>
      <Button
        size="sm"
        disabled={!valid || disabled}
        onPress={() => onPropose(basePrice, comm)}
      >
        <Text className="text-sm font-semibold text-white">Cotizar</Text>
      </Button>
    </Card>
  );
}
