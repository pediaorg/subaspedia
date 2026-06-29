import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ChevronRight } from "lucide-react-native";
import { useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import {
  PAYMENT_METHOD_TYPE_LABELS,
  type PaymentMethod,
} from "@subaspedia/types/payment-method";
import type { TransactionDetail } from "@subaspedia/types/transaction";
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

type TransactionPaymentDialogProps = {
  transaction: TransactionDetail;
  // Se llama al confirmar el pago (la pantalla navega al perfil).
  onPaid: () => void;
};

function typeLabel(type: PaymentMethod["type"]): string {
  return PAYMENT_METHOD_TYPE_LABELS.find(t => t.value === type)?.label ?? type;
}

// Pago de una compra ganada. Mismo molde que PenaltyPaymentDialog: dialog 100%
// controlado SIN DialogTrigger (el trigger con `open` controlado desincroniza
// el contenido portaleado en rn-primitives). Dos pasos: elegir medio verificado
// -> resumen (total de la factura) -> Pagar. Al confirmar deja la compra
// 'pending' (esperando al backoffice) y la pantalla vuelve al perfil.
export default function TransactionPaymentDialog({
  transaction,
  onPaid,
}: TransactionPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Bloquea el doble-submit: isPending de la mutación no flipea en el mismo
  // tick que el tap, así que dos tappeos rápidos largaban dos requests.
  const submittingRef = useRef(false);
  const queryClient = useQueryClient();

  // Medios de pago del usuario; el selector solo ofrece los verificados.
  const { data: methods, isLoading } = api.user.listPaymentMethods.useQuery();
  const eligible = methods?.filter(m => m.verified) ?? [];
  const selected = eligible.find(m => m.id === selectedId) ?? null;

  const { mutate: payTransaction, isPending } =
    api.user.payTransaction.useMutation({
      onSuccess: () => {
        // El back es la fuente de verdad: refresca la lista de pagos y este
        // detalle (la compra pasa a "Pendiente").
        queryClient.invalidateQueries({
          queryKey: api.user.transactions.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: api.user.transactionById.queryKey({
            input: { id: transaction.id },
          }),
        });
        // Cerramos el dialog y dejamos que la animación de salida del Portal
        // termine ANTES de navegar; si navegamos mientras el contenido
        // portaleado todavía está animando, rn-primitives/reanimated puede
        // quedar apuntando a un host desmontado y cerrar la app.
        handleOpenChange(false);
        setTimeout(() => {
          submittingRef.current = false;
          onPaid();
        }, 220);
      },
      onError: error => {
        submittingRef.current = false;
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
    // isPending no flipea sincrónicamente al llamar mutate; usamos un ref para
    // descartar el segundo tap antes de que la mutación lo bloquee.
    if (submittingRef.current || isPending) return;
    if (selectedId === null) return;
    submittingRef.current = true;
    payTransaction({ id: transaction.id, paymentMethodId: selectedId });
  }

  return (
    <>
      <Button
        size="lg"
        onPress={() => setOpen(true)}
        className="mt-2 h-12 self-center rounded-full bg-primary px-12 shadow-none"
      >
        <Text className="text-base font-bold text-white">Pagar</Text>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="bg-primary-foreground gap-4">
          {selected === null ? (
            <>
              <DialogHeader>
                <DialogTitle className="w-90">Pagar con</DialogTitle>
              </DialogHeader>

              {isLoading && (
                <Text className="text-gray-500 text-center">Cargando…</Text>
              )}

              {!isLoading && eligible.length === 0 && (
                <Text className="text-gray-500 text-center">
                  No tenés medios de pago verificados. Verificá uno para poder
                  pagar la compra.
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
                  {transaction.productName}
                </Text>
                <Text className="font-bold text-2xl text-gray-900">
                  {formatMoney(transaction.total, transaction.currency)}
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
