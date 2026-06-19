import { BadgeCheck, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/format";

type PenaltyPaymentDialogProps = {
  penalty: Penalty;
  onPaid: (penaltyId: number) => void;
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
  onPaid,
}: PenaltyPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // GET real de los medios de pago (mismo que la pantalla de medios); el
  // selector solo ofrece los elegibles para pagar esta multa.
  const { data: methods, isLoading } = api.user.listPaymentMethods.useQuery();
  const eligible = methods?.filter(m => canPayPenaltyWith(m, penalty)) ?? [];
  const selected = eligible.find(m => m.id === selectedId) ?? null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSelectedId(null); // reset al cerrar
  }

  function handlePay() {
    // Mock: el cambio a "paid" lo aplica la pantalla sobre la cache (operación
    // síncrona, no puede fallar -> sin manejo de error acá). Cuando exista el
    // back, esto pasa a una mutation (PUT /penalties/{id}/status) que mandará el
    // medio seleccionado (selectedId) y manejará el fallo en su onError (Alert).
    onPaid(penalty.id);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pagar"
          className="active:opacity-60 pr-2"
        >
          <Text className="text-xs text-gray-700 underline">Pagar</Text>
        </Pressable>
      </DialogTrigger>

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

            <View className="gap-3">
              {eligible.map(method => (
                <Pressable
                  key={method.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Pagar con ${typeLabel(method.type)}`}
                  onPress={() => setSelectedId(method.id)}
                  className="flex-row items-center gap-3 rounded-2xl bg-white px-4 py-3 active:opacity-70 drop-shadow-md/20"
                >
                  <Icon as={BadgeCheck} size={28} className="text-green-700" />
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
                  <Icon as={ChevronRight} size={20} className="text-gray-400" />
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Resumen de pago</DialogTitle>
            </DialogHeader>

            <View className="gap-1">
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
                <Text className="text-xs text-gray-700 underline">Cambiar</Text>
              </Pressable>
            </View>

            <Button onPress={handlePay} className="mt-2">
              <Text className="font-bold text-white">Pagar</Text>
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
