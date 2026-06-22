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
            productId={p.id}
            ownerId={p.ownerId}
            name={p.name}
            description={p.fullDescription}
            onProposed={refetchAll}
          />
        ))}
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
          <QuoteRow
            key={q.id}
            itemId={q.id}
            ownerId={q.ownerId}
            productName={q.productName}
            basePrice={q.basePrice}
            commission={q.commission}
            state={q.state}
            onChanged={() => quotes.refetch()}
          />
        ))}
      </View>
    </View>
  );
}

function AppraisalRow({
  productId,
  ownerId,
  name,
  description,
  onProposed,
}: {
  productId: number;
  ownerId: number | null;
  name: string;
  description: string | null;
  onProposed: () => void;
}) {
  const [base, setBase] = useState("");
  const [commission, setCommission] = useState("");

  const notify = api.notifications.create.useMutation();
  const propose = api.backoffice.proposeQuote.useMutation({
    onSuccess: async (_, variables) => {
      // Avisar al dueño que le llegó una propuesta de cotización (route
      // "proposal" -> Mis productos). El owner es la misma persona que el client
      // (mismo id), pero podría no estar dado de alta como client todavía: si la
      // notificación falla NO rompemos la cotización.
      if (ownerId != null) {
        try {
          await notify.mutateAsync({
            clientId: ownerId,
            title: "Nueva propuesta de cotización",
            body: `Tasamos tu bien "${name}": valor base $${variables.basePrice} y comisión del ${variables.commission}%. Revisá la propuesta en Mis productos.`,
            route: "proposal",
          });
        } catch {}
      }
      onProposed();
    },
  });

  const basePrice = Number(base);
  const comm = Number(commission);
  const valid =
    base.length > 0 &&
    commission.length > 0 &&
    basePrice > 0 &&
    comm > 0 &&
    Number.isFinite(basePrice) &&
    Number.isFinite(comm);

  const busy = propose.isPending || notify.isPending;

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
        disabled={!valid || busy}
        onPress={() =>
          propose.mutate({ productId, basePrice, commission: comm })
        }
      >
        <Text className="text-sm font-semibold text-white">
          {busy ? "..." : "Cotizar"}
        </Text>
      </Button>
      {propose.error && (
        <Text className="text-red-500 text-sm">{propose.error.message}</Text>
      )}
    </Card>
  );
}

function QuoteRow({
  itemId,
  ownerId,
  productName,
  basePrice,
  commission,
  state,
  onChanged,
}: {
  itemId: number;
  ownerId: number | null;
  productName: string;
  basePrice: number;
  commission: number;
  state: string | null;
  onChanged: () => void;
}) {
  const notify = api.notifications.create.useMutation();
  const confirm = api.backoffice.confirmQuote.useMutation({
    onSuccess: async () => {
      // Avisar al dueño que su producto fue aceptado. Reusamos la route
      // "proposal" porque también lleva a Mis productos. Tolerante a fallo
      // (mismo motivo que en AppraisalRow).
      if (ownerId != null) {
        try {
          await notify.mutateAsync({
            clientId: ownerId,
            title: "¡Tu producto fue aceptado!",
            body: `Aceptamos "${productName}" y ya quedó listo para incluirse en una próxima subasta. Podés verlo en Mis productos.`,
            route: "proposal",
          });
        } catch {}
      }
      onChanged();
    },
  });
  const reject = api.backoffice.rejectQuote.useMutation({
    onSuccess: onChanged,
  });

  const busy = confirm.isPending || reject.isPending || notify.isPending;

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <Text className="font-semibold">{productName}</Text>
        <Text className="text-muted-foreground text-xs">
          {QUOTE_STATE_LABELS[state ?? ""] ?? state}
        </Text>
      </View>
      <Text className="text-sm">
        Base ${basePrice} · Comisión ${commission}
      </Text>
      {state === "tasado" && (
        <View className="mt-1 flex-row gap-2">
          <Button
            size="sm"
            disabled={busy}
            onPress={() => confirm.mutate({ itemId })}
          >
            <Text className="text-sm font-semibold text-white">
              {busy ? "..." : "Confirmar"}
            </Text>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onPress={() => reject.mutate({ itemId })}
          >
            <Text className="text-sm font-medium">Rechazar</Text>
          </Button>
        </View>
      )}
    </Card>
  );
}
