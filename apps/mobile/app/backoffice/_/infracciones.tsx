import { useState } from "react";
import { View } from "react-native";

import type { Currency } from "@subaspedia/types";
import PenaltyStatusBadge from "@/components/profile/infractions/penalty-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

import { Card, QueryState, SectionHeader } from "./shared";

const CURRENCIES = [
  { value: "ARS" as const, label: "Pesos (ARS)" },
  { value: "USD" as const, label: "Dólares (USD)" },
];

// Feature 0: emisión de multas (penalties) desde el backoffice. El modelo es el
// de la PR #24; acá está el lado que emite. La multa puede atarse a una subasta
// (hereda su moneda) o ser genérica (moneda a mano).
export function InfraccionesSection() {
  const clients = api.backoffice.listClients.useQuery();
  const auctions = api.backoffice.listAuctionsForPenalty.useQuery();
  const list = api.backoffice.listPenalties.useQuery();

  const [clientId, setClientId] = useState<number | null>(null);
  const [auctionId, setAuctionId] = useState<number | null>(null);
  const [currency, setCurrency] = useState<Currency>("ARS");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");

  const notify = api.notifications.create.useMutation();

  const create = api.backoffice.createPenalty.useMutation({
    onSuccess: async (_, variables) => {
      await notify.mutateAsync({
        clientId: variables.clientId,
        title: "Nueva multa",
        body: `Se ha emitido una multa en tu cuenta.\nMotivo: ${variables.reason}.\nMonto: ${formatMoney(variables.amount, variables.currency ?? effectiveCurrency)}.`,
        route: "sanction",
      });

      setClientId(null);
      setAuctionId(null);
      setCurrency("ARS");
      setReason("");
      setAmount("");
      list.refetch();
    },
  });
  const markPaid = api.backoffice.markPenaltyPaid.useMutation({
    onSuccess: () => list.refetch(),
  });

  const parsed = Number(amount);
  const valid =
    clientId !== null &&
    reason.trim().length > 0 &&
    amount.length > 0 &&
    parsed > 0.01 &&
    Number.isFinite(parsed);

  const clientName = clients.data?.find(c => c.id === clientId)?.name;
  const selectedAuction = auctions.data?.find(a => a.id === auctionId);
  // Si la multa se ata a una subasta, la moneda la hereda de esa subasta.
  const effectiveCurrency = (selectedAuction?.currency ?? currency) as Currency;
  const currencyLabel = CURRENCIES.find(c => c.value === currency)?.label;

  return (
    <View className="gap-6">
      <View className="gap-3">
        <SectionHeader
          title="Nueva multa"
          hint="Emití una multa contra un cliente. Si la atás a una subasta hereda su moneda; vence a las 72hs."
        />

        <Select
          value={
            clientId
              ? { value: String(clientId), label: clientName ?? "" }
              : undefined
          }
          onValueChange={opt => setClientId(opt ? Number(opt.value) : null)}
        >
          <SelectTrigger className="bg-secondary w-full rounded-lg border-none">
            <SelectValue placeholder="Cliente" />
          </SelectTrigger>
          <SelectContent className="border-none bg-white drop-shadow-lg">
            {(clients.data ?? []).map(c => (
              <SelectItem key={c.id} value={String(c.id)} label={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={
            auctionId
              ? {
                  value: String(auctionId),
                  label: selectedAuction
                    ? `#${selectedAuction.id} · ${selectedAuction.currency}`
                    : "",
                }
              : undefined
          }
          onValueChange={opt => setAuctionId(opt ? Number(opt.value) : null)}
        >
          <SelectTrigger className="bg-secondary w-full rounded-lg border-none">
            <SelectValue placeholder="Subasta (opcional)" />
          </SelectTrigger>
          <SelectContent className="border-none bg-white drop-shadow-lg">
            {(auctions.data ?? []).map(a => (
              <SelectItem
                key={a.id}
                value={String(a.id)}
                label={`#${a.id} · ${a.currency}`}
              >
                {`#${a.id}${a.date ? ` · ${a.date}` : ""} · ${a.currency}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* La moneda solo se elige a mano cuando la multa no se ata a subasta. */}
        {auctionId === null && (
          <Select
            value={{ value: currency, label: currencyLabel ?? currency }}
            onValueChange={opt =>
              setCurrency((opt?.value as Currency) ?? "ARS")
            }
          >
            <SelectTrigger className="bg-secondary w-full rounded-lg border-none">
              <SelectValue placeholder="Moneda" />
            </SelectTrigger>
            <SelectContent className="border-none bg-white drop-shadow-lg">
              {CURRENCIES.map(c => (
                <SelectItem key={c.value} value={c.value} label={c.label}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Textarea
          value={reason}
          onChangeText={setReason}
          placeholder="Motivo de la multa"
          className="bg-secondary border-none"
        />
        <Input
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder={`Monto (${effectiveCurrency})`}
          className="bg-secondary border-none"
        />

        <Button
          disabled={!valid || create.isPending || notify.isPending}
          onPress={() =>
            clientId &&
            create.mutate({
              clientId,
              reason: reason.trim(),
              amount: parsed,
              // Con subasta, el back deriva la moneda; sin subasta, la mandamos.
              ...(auctionId ? { auctionId } : { currency }),
            })
          }
        >
          <Text className="font-semibold text-white">
            {create.isPending || notify.isPending
              ? "Emitiendo..."
              : "Emitir multa"}
          </Text>
        </Button>
        {create.error && (
          <Text className="text-red-500 text-sm">{create.error.message}</Text>
        )}
      </View>

      <View className="gap-3">
        <SectionHeader title="Multas emitidas" />
        <QueryState
          isLoading={list.isLoading}
          error={list.error}
          empty={list.data?.length === 0}
          emptyText="No hay multas emitidas"
        />
        {list.data?.map(p => (
          <Card key={p.id}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="font-semibold">{p.clientName}</Text>
                <Text className="text-sm">{p.reason}</Text>
                <Text className="text-muted-foreground text-sm">
                  {formatMoney(p.amount, p.currency)}
                  {p.auctionId ? ` · subasta #${p.auctionId}` : ""}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  Vence: {new Date(p.dueDate).toLocaleDateString("es-AR")}
                </Text>
              </View>
              <PenaltyStatusBadge status={p.status} />
            </View>
            {p.status !== "paid" && (
              <Button
                size="sm"
                variant="outline"
                disabled={markPaid.isPending}
                onPress={() => markPaid.mutate({ id: p.id })}
                className="mt-1 self-start"
              >
                <Text className="text-sm font-medium">Marcar saldada</Text>
              </Button>
            )}
          </Card>
        ))}
      </View>
    </View>
  );
}
