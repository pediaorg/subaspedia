import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import {
  PAYMENT_METHOD_TYPE_LABELS,
  type PaymentMethod,
} from "@subaspedia/types/payment-method";
import type { Penalty } from "@subaspedia/types/penalty";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

type PenaltyPaymentDialogProps = {
  penalty: Penalty;
};

// Único criterio de elegibilidad de un medio para pagar una multa. Hoy solo
// exige que esté verificado (lo único que el dato permite). El gancho de moneda
// queda preparado: cuando `PaymentMethod` modele moneda/scope (territorio
// compartido, confirmar con el equipo), basta sumar el `&&` de abajo —un solo
// lugar de cambio— porque la multa ya expone `penalty.currency`.
export function canPayPenaltyWith(
  method: PaymentMethod,
  _penalty: Penalty,
): boolean {
  // TODO(moneda): && methodSupportsCurrency(method, _penalty.currency)
  return method.verified;
}

function typeLabel(type: PaymentMethod["type"]): string {
  return PAYMENT_METHOD_TYPE_LABELS.find(t => t.value === type)?.label ?? type;
}

export default function PenaltyPaymentDialog({
  penalty,
}: PenaltyPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // GET real de los medios de pago (mismo que la pantalla de medios); el
  // selector solo ofrece los elegibles para pagar esta multa.
  const { data: methods, isLoading } = api.user.listPaymentMethods.useQuery();
  const eligible = methods?.filter(m => canPayPenaltyWith(m, penalty)) ?? [];
  const selected = eligible.find(m => m.id === selectedId) ?? null;

  const { mutate: payPenalty, isPending } = api.user.payPenalty.useMutation({
    onSuccess: () => {
      // Refresca la lista de multas: la pagada vuelve como "paid" y desaparece
      // su botón Pagar (el back es la fuente de verdad, no tocamos la cache).
      queryClient.invalidateQueries({
        queryKey: api.user.penalties.queryKey(),
      });
      handleOpenChange(false);
    },
    onError: error => {
      Alert.alert(
        "No se pudo pagar",
        error.message || "Intentá de nuevo más tarde.",
      );
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSelectedId(null); // reset al cerrar
  }

  function handlePay() {
    if (isPending) return; // evita el doble-submit (reintentos -> 409)
    if (selectedId === null) return; // el botón Pagar solo aparece con medio elegido
    // Vencida (pasadas las 72hs) ya no se puede pagar. Cubre el caso de que la
    // multa venza con el dialog abierto: el back también lo rechaza.
    if (
      penalty.status === "overdue" ||
      new Date(penalty.dueDate) < new Date()
    ) {
      Alert.alert(
        "No se pudo pagar",
        "La multa venció y ya no se puede pagar.",
      );
      handleOpenChange(false);
      return;
    }
    payPenalty({
      id: penalty.id,
      status: "paid",
      paymentMethodId: selectedId,
    });
  }

  return (
    <>
      {/* Disparador controlado: setea `open` directo en vez de DialogTrigger.
          Con el trigger, rn-primitives desincroniza el `open` controlado y el
          DialogContent (portaleado) deja de reflejar el estado -> no cerraba ni
          mostraba "Pagando…". Manteniéndolo 100% controlado, sí. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Pagar"
        onPress={() => setOpen(true)}
        className="active:opacity-60 pr-2"
      >
        <Text className="text-xs text-gray-700 underline">Pagar</Text>
      </Pressable>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-primary-foreground gap-4">
          {selected === null ? (
            <>
              <DialogHeader>
                <DialogTitle className="w-90">Pagar con</DialogTitle>
              </DialogHeader>

              {isLoading && (
                <Text className="text-gray-500 text-center ">Cargando…</Text>
              )}

              {!isLoading && eligible.length === 0 && (
                <Text className="text-gray-500 text-center">
                  No tenés medios de pago verificados. Verificá uno para poder
                  pagar la multa.
                </Text>
              )}

              <View className="gap-3 w-auto">
                {eligible.map(method => (
                  <Pressable
                    key={method.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Pagar con ${typeLabel(method.type)}`}
                    onPress={() => setSelectedId(method.id)}
                    className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3 active:opacity-70 drop-shadow-md/20"
                  >
                    <Icon
                      as={BadgeCheck}
                      size={28}
                      className="text-green-700"
                    />
                    <View className="flex-1 flex-col gap-0.5">
                      <Text
                        className="font-bold text-sm text-gray-800"
                        numberOfLines={1}
                      >
                        {typeLabel(method.type)}
                      </Text>
                      <Text className="text-xs text-gray-600" numberOfLines={1}>
                        {method.details}
                      </Text>
                    </View>
                    <Icon
                      as={ChevronRight}
                      size={20}
                      className="text-gray-400"
                    />
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Resumen de pago</DialogTitle>
              </DialogHeader>

              <View className="gap-1 w-90">
                <Text className="text-sm text-gray-600" numberOfLines={2}>
                  {penalty.reason}
                </Text>
                <Text className="font-bold text-2xl text-gray-900">
                  {formatMoney(penalty.amount, penalty.currency)}
                </Text>
              </View>

              <Separator className="bg-gray-300" />

              <View className="flex-row items-center gap-3">
                <Icon as={BadgeCheck} size={24} className="text-green-700" />
                <View className="flex-1 flex-col">
                  <Text className="text-sm text-gray-800" numberOfLines={1}>
                    {typeLabel(selected.type)}
                  </Text>
                  <Text className="text-xs text-gray-600" numberOfLines={1}>
                    {selected.details}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar medio de pago"
                  onPress={() => setSelectedId(null)}
                  className="active:opacity-60"
                >
                  <Text className="text-xs text-gray-700 underline">
                    Cambiar
                  </Text>
                </Pressable>
              </View>

              <Button onPress={handlePay} disabled={isPending} className="mt-2">
                <Text className="font-bold text-white">
                  {isPending ? "Pagando…" : "Pagar"}
                </Text>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
