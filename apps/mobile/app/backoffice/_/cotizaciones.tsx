import { useState } from "react";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

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

  // Notificaciones al dueño del bien. Fire-and-forget (notify.mutate, sin await):
  // si el owner todavía no está dado de alta como client la notificación falla
  // pero NO rompe la cotización. Reusamos la route "proposal" (lleva a Mis
  // productos) tanto para la propuesta como para el aviso de aceptado.
  const notify = api.notifications.create.useMutation();

  const propose = api.backoffice.proposeQuote.useMutation({
    onSuccess: (_, variables) => {
      const product = pending.data?.find(p => p.id === variables.productId);
      if (product?.ownerId != null) {
        notify.mutate({
          clientId: product.ownerId,
          title: "Nueva propuesta de cotización",
          body: `Tasamos tu bien "${product.name}": valor base ${formatMoney(variables.basePrice, "ARS")} y comisión del ${variables.commission}%. Revisá la propuesta en Mis productos.`,
          route: "proposal",
        });
      }
      refetchAll();
    },
  });
  const rejectAppraisal = api.backoffice.rejectAppraisal.useMutation({
    onSuccess: refetchAll,
  });
  const confirm = api.backoffice.confirmQuote.useMutation({
    onSuccess: (_, variables) => {
      const quote = quotes.data?.find(q => q.id === variables.quoteId);
      if (quote?.ownerId != null) {
        notify.mutate({
          clientId: quote.ownerId,
          title: "¡Tu producto fue aceptado!",
          body: `Aceptamos "${quote.productName}" y ya quedó listo para incluirse en una próxima subasta. Podés verlo en Mis productos.`,
          route: "proposal",
        });
      }
      quotes.refetch();
    },
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
            disabled={propose.isPending || rejectAppraisal.isPending}
            onPropose={(
              basePrice,
              commission,
              message,
              insurancePolicyNumber,
              insuranceCompany,
              insuranceAmount,
              insuranceCombined,
            ) =>
              propose.mutate({
                productId: p.id,
                basePrice,
                commission,
                message,
                insurancePolicyNumber,
                insuranceCompany,
                insuranceAmount,
                insuranceCombined,
              })
            }
            onReject={message =>
              rejectAppraisal.mutate({ productId: p.id, message })
            }
          />
        ))}
        {(propose.error || rejectAppraisal.error) && (
          <Text className="text-red-500 text-sm">
            {(propose.error ?? rejectAppraisal.error)?.message}
          </Text>
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
            {q.basePrice !== null && q.commission !== null && (
              <Text className="text-sm">
                Base {formatMoney(q.basePrice, "ARS")} · Comisión {q.commission}
                %
              </Text>
            )}
            {q.message && (
              <Text className="text-muted-foreground text-xs" numberOfLines={2}>
                {q.message}
              </Text>
            )}
            {q.state === "tasado" && (
              <View className="mt-1 flex-row gap-2">
                <Button
                  size="sm"
                  disabled={confirm.isPending}
                  onPress={() => confirm.mutate({ quoteId: q.id })}
                >
                  <Text className="text-sm font-semibold text-white">
                    Confirmar
                  </Text>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={reject.isPending}
                  onPress={() => reject.mutate({ quoteId: q.id })}
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
  onReject,
}: {
  name: string;
  description: string | null;
  disabled?: boolean;
  onPropose: (
    basePrice: number,
    commission: number,
    message: string,
    insurancePolicyNumber?: string,
    insuranceCompany?: string,
    insuranceAmount?: number,
    insuranceCombined?: boolean,
  ) => void;
  onReject: (message: string) => void;
}) {
  const [base, setBase] = useState("");
  const [commission, setCommission] = useState("");
  const [message, setMessage] = useState("");

  // Campos para el seguro opcional
  const [policyNumber, setPolicyNumber] = useState("");
  const [company, setCompany] = useState("");
  const [insuranceAmountStr, setInsuranceAmountStr] = useState("");
  const [combined, setCombined] = useState(false);

  const basePrice = Number(base);
  const comm = Number(commission);

  const insAmount = Number(insuranceAmountStr);
  const isInsuranceEmpty =
    policyNumber.trim() === "" &&
    company.trim() === "" &&
    insuranceAmountStr.trim() === "";
  const isInsuranceValid =
    isInsuranceEmpty ||
    (policyNumber.trim() !== "" &&
      company.trim() !== "" &&
      insuranceAmountStr.trim() !== "" &&
      insAmount > 0 &&
      Number.isFinite(insAmount));

  const valid =
    base.length > 0 &&
    commission.length > 0 &&
    message.trim().length > 0 &&
    basePrice > 0 &&
    // La comisión es un porcentaje del precio base: 0 < x <= 100.
    comm > 0 &&
    comm <= 100 &&
    Number.isFinite(basePrice) &&
    Number.isFinite(comm) &&
    isInsuranceValid;

  // Rechazar solo exige el motivo (mensaje), no precio ni comisión.
  const canReject = message.trim().length > 0;

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
          placeholder="Comisión (%)"
          className="bg-secondary flex-1 border-none"
        />
      </View>
      <Input
        value={message}
        onChangeText={setMessage}
        placeholder="Mensaje (propuesta o motivo del rechazo)"
        className="bg-secondary border-none"
      />

      <Text className="font-semibold text-xs mt-2 text-muted-foreground">
        Datos del Seguro (Opcional)
      </Text>
      <View className="flex-row gap-2">
        <Input
          value={policyNumber}
          onChangeText={setPolicyNumber}
          placeholder="Nro de Póliza"
          className="bg-secondary flex-1 border-none"
        />
        <Input
          value={company}
          onChangeText={setCompany}
          placeholder="Compañía"
          className="bg-secondary flex-1 border-none"
        />
      </View>
      <View className="flex-row gap-4 items-center mt-1">
        <Input
          value={insuranceAmountStr}
          onChangeText={setInsuranceAmountStr}
          keyboardType="numeric"
          placeholder="Importe Asegurado"
          className="bg-secondary flex-1 border-none"
        />
        <View className="flex-row items-center gap-2 pr-2">
          <Switch checked={combined} onCheckedChange={setCombined} />
          <Text className="text-sm">Combinada</Text>
        </View>
      </View>

      <View className="flex-row gap-2 mt-2">
        <Button
          size="sm"
          className="flex-1"
          disabled={!valid || disabled}
          onPress={() =>
            onPropose(
              basePrice,
              comm,
              message.trim(),
              policyNumber.trim() || undefined,
              company.trim() || undefined,
              insuranceAmountStr.trim() ? insAmount : undefined,
              combined,
            )
          }
        >
          <Text className="text-sm font-semibold text-white">Cotizar</Text>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={!canReject || disabled}
          onPress={() => onReject(message.trim())}
        >
          <Text className="text-sm font-medium">Rechazar</Text>
        </Button>
      </View>
    </Card>
  );
}
