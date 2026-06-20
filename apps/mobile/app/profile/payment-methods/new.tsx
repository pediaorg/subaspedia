import { useQueryClient } from "@tanstack/react-query";
import * as Burnt from "burnt";
import { router, Stack } from "expo-router";
import {
  ArrowLeft,
  CreditCard,
  Landmark,
  ScrollText,
} from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

// Pantalla de PRUEBA, aislada del flujo. El alta ya pega al backend
// (user.addPaymentMethod): el medio queda sin verificar hasta que el backoffice
// lo valida. La integración al circuito real (rutas/guards) la vemos después.

const INPUT = "bg-secondary border-none";

type MethodType = "credit_card" | "bank_account" | "certified_check";

const TYPES: { value: MethodType; label: string }[] = [
  { value: "credit_card", label: "Tarjeta" },
  { value: "bank_account", label: "Cuenta" },
  { value: "certified_check", label: "Cheque" },
];

export default function PaymentMethodScreen() {
  const [type, setType] = useState<MethodType>("credit_card");

  // Campos de tarjeta de crédito
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");

  // Campos de cuenta bancaria
  const [bank, setBank] = useState("");
  const [cbu, setCbu] = useState("");

  // Campos de cheque certificado
  const [checkBank, setCheckBank] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [checkAmount, setCheckAmount] = useState("");

  const queryClient = useQueryClient();
  const addPaymentMethod = api.user.addPaymentMethod.useMutation({
    onSuccess: () => {
      // Refresca el listado de "Métodos de pago" para que aparezca el nuevo.
      queryClient.invalidateQueries({
        queryKey: api.user.listPaymentMethods.queryKey(),
      });
      Burnt.toast({
        title: "Medio agregado",
        message: "Queda pendiente de validación por la empresa.",
        preset: "done",
      });
      if (router.canGoBack()) router.back();
    },
  });

  // Arma el texto descriptivo que ve el backoffice, sin datos sensibles
  // (nunca el CVV ni el número/CBU completos).
  const buildDetails = () => {
    if (type === "credit_card")
      return [
        `Tarjeta ${maskTail(cardNumber) ?? "—"}`,
        `Vence ${expiry || "—"}`,
        holder && `Titular ${holder}`,
      ]
        .filter(Boolean)
        .join(" · ");
    if (type === "bank_account")
      return [
        bank || "Banco",
        `CBU ${maskTail(cbu) ?? "—"}`,
        holder && `Titular ${holder}`,
      ]
        .filter(Boolean)
        .join(" · ");
    return [
      checkBank || "Banco emisor",
      `Cheque N° ${checkNumber || "—"}`,
      `$ ${checkAmount || "0"}`,
    ].join(" · ");
  };

  const onAdd = () =>
    addPaymentMethod.mutate({
      type,
      details: buildDetails(),
    });

  return (
    <View className="flex-1 bg-muted">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header con back, consistente con el ProfileHeader del resto del
          perfil: mismo ícono (ArrowLeft), círculo y posición (px-6 py-14). */}
      <View className="flex-row items-center px-6 py-14">
        <Pressable
          hitSlop={12}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        >
          <View
            className="size-10 items-center justify-center rounded-full bg-white"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Icon as={ArrowLeft} size={24} className="text-foreground" />
          </View>
        </Pressable>
      </View>

      {/* Cajón blanco que sube desde abajo (contenedor 2) */}
      <View className="flex-1 overflow-hidden rounded-t-3xl bg-white">
        <ScrollView
          contentContainerClassName="grow gap-4 px-6 pb-12 pt-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center gap-2">
            <Text variant="h3" className="font-bold">
              Método de pago
            </Text>
            <Separator className="w-24 bg-gray-300" />
          </View>

          {/* Selector de tipo de medio */}
          <View className="flex-row gap-2">
            {TYPES.map(t => (
              <Button
                key={t.value}
                size="sm"
                variant={type === t.value ? "default" : "outline"}
                onPress={() => setType(t.value)}
                className={
                  type === t.value
                    ? "bg-accent-foreground flex-1 rounded-full border-0"
                    : "flex-1 rounded-full"
                }
              >
                <Text
                  className={
                    type === t.value
                      ? "text-sm font-semibold text-white"
                      : "text-sm font-medium"
                  }
                >
                  {t.label}
                </Text>
              </Button>
            ))}
          </View>

          {/* Preview tipo tarjeta (como el wireframe). Se llena en vivo con los
            datos, ocultando lo sensible (número/CBU enmascarados, CVV nunca). */}
          <CardPreview
            type={type}
            cardNumber={cardNumber}
            holder={holder}
            expiry={expiry}
            bank={bank}
            cbu={cbu}
            checkBank={checkBank}
            checkNumber={checkNumber}
            checkAmount={checkAmount}
          />

          {/* Campos según el tipo */}
          {type === "credit_card" && (
            <>
              <FormField label="Número de tarjeta">
                <Input
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="number-pad"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  className={INPUT}
                />
              </FormField>

              <View className="flex-row gap-3">
                <FormField label="Vencimiento" className="flex-1">
                  <Input
                    value={expiry}
                    onChangeText={setExpiry}
                    placeholder="MM/AA"
                    maxLength={5}
                    className={INPUT}
                  />
                </FormField>
                <FormField label="CVV" className="flex-1">
                  <Input
                    value={cvv}
                    onChangeText={setCvv}
                    keyboardType="number-pad"
                    placeholder="123"
                    maxLength={4}
                    secureTextEntry
                    className={INPUT}
                  />
                </FormField>
              </View>

              <FormField label="Titular">
                <Input
                  value={holder}
                  onChangeText={setHolder}
                  placeholder="Nombre como figura en la tarjeta"
                  autoCapitalize="characters"
                  className={INPUT}
                />
              </FormField>
            </>
          )}

          {type === "bank_account" && (
            <>
              <FormField label="Banco">
                <Input
                  value={bank}
                  onChangeText={setBank}
                  placeholder="Ej: Banco Galicia"
                  className={INPUT}
                />
              </FormField>
              <FormField label="CBU / IBAN">
                <Input
                  value={cbu}
                  onChangeText={setCbu}
                  keyboardType="number-pad"
                  placeholder="0000000000000000000000"
                  className={INPUT}
                />
              </FormField>
              <FormField label="Titular">
                <Input
                  value={holder}
                  onChangeText={setHolder}
                  placeholder="Nombre del titular"
                  className={INPUT}
                />
              </FormField>
            </>
          )}

          {type === "certified_check" && (
            <>
              <FormField label="Banco emisor">
                <Input
                  value={checkBank}
                  onChangeText={setCheckBank}
                  placeholder="Ej: Banco Nación"
                  className={INPUT}
                />
              </FormField>
              <FormField label="Número de cheque">
                <Input
                  value={checkNumber}
                  onChangeText={setCheckNumber}
                  keyboardType="number-pad"
                  placeholder="00000000"
                  className={INPUT}
                />
              </FormField>
              <FormField label="Monto certificado">
                <Input
                  value={checkAmount}
                  onChangeText={setCheckAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  className={INPUT}
                />
              </FormField>
            </>
          )}

          {addPaymentMethod.error ? (
            <Text className="text-destructive text-center text-sm">
              {addPaymentMethod.error.message}
            </Text>
          ) : null}

          <Button
            size="lg"
            disabled={addPaymentMethod.isPending}
            onPress={onAdd}
            className="bg-accent-foreground mt-2 self-center rounded-full border-0 px-12 py-4 shadow-none"
          >
            <Text className="text-base font-bold text-white">
              {addPaymentMethod.isPending ? "Agregando..." : "Agregar"}
            </Text>
          </Button>

          <Text className="text-accent-foreground text-center text-xs">
            La empresa validará tu medio de pago antes de habilitarte a pujar.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const PREVIEW_LABEL: Record<MethodType, string> = {
  credit_card: "Tarjeta de crédito",
  bank_account: "Cuenta bancaria",
  certified_check: "Cheque certificado",
};

// Enmascara un número dejando visibles solo los últimos `visible` dígitos.
// Devuelve null si todavía no hay dígitos (para mostrar el placeholder).
function maskTail(value: string, visible = 4): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  const tail = digits.slice(-visible);
  const hidden = "•".repeat(Math.max(0, digits.length - tail.length));
  return `${hidden}${tail}`.replace(/(.{4})/g, "$1 ").trim();
}

function CardPreview(props: {
  type: MethodType;
  cardNumber: string;
  holder: string;
  expiry: string;
  bank: string;
  cbu: string;
  checkBank: string;
  checkNumber: string;
  checkAmount: string;
}) {
  if (props.type === "credit_card")
    return (
      <CreditCardLayout
        cardNumber={props.cardNumber}
        holder={props.holder}
        expiry={props.expiry}
      />
    );
  if (props.type === "bank_account")
    return (
      <BankAccountLayout
        bank={props.bank}
        cbu={props.cbu}
        holder={props.holder}
      />
    );
  return (
    <CheckLayout
      bank={props.checkBank}
      number={props.checkNumber}
      amount={props.checkAmount}
    />
  );
}

// Tarjeta de crédito: card oscura con chip y banda de número.
function CreditCardLayout({
  cardNumber,
  holder,
  expiry,
}: {
  cardNumber: string;
  holder: string;
  expiry: string;
}) {
  return (
    <View className="bg-neutral-800 gap-7 rounded-2xl p-6 shadow-md">
      <View className="flex-row items-start justify-between">
        <Text className="text-sm font-medium text-white/80">
          {PREVIEW_LABEL.credit_card}
        </Text>
        <Icon as={CreditCard} size={22} className="text-white/70" />
      </View>

      {/* Número + chip en la misma fila para ahorrar alto */}
      <View className="flex-row items-center justify-between">
        <Text className="text-lg tracking-[2px] text-white">
          {maskTail(cardNumber) ?? "•••• •••• •••• ••••"}
        </Text>
        <View className="bg-yellow-400/80 h-7 w-10 rounded-md" />
      </View>

      <View className="flex-row justify-between">
        <PreviewField
          label="Titular"
          value={holder}
          fallback="NOMBRE APELLIDO"
        />
        <PreviewField label="Vence" value={expiry} fallback="MM/AA" />
      </View>
    </View>
  );
}

// Cuenta bancaria: tarjeta índigo, banco protagonista arriba, CBU enmascarado.
function BankAccountLayout({
  bank,
  cbu,
  holder,
}: {
  bank: string;
  cbu: string;
  holder: string;
}) {
  return (
    <View className="bg-indigo-700 gap-5 rounded-2xl p-5 shadow-md">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon as={Landmark} size={20} className="text-white/80" />
          <Text className="text-base font-semibold text-white">
            {bank || "Banco"}
          </Text>
        </View>
        <Text className="text-xs text-white/60">
          {PREVIEW_LABEL.bank_account}
        </Text>
      </View>

      <View className="gap-0.5">
        <Text className="text-[10px] uppercase text-white/50">CBU / IBAN</Text>
        <Text className="text-lg tracking-[2px] text-white">
          {maskTail(cbu) ?? "•••• •••• •••• ••••"}
        </Text>
      </View>

      <PreviewField label="Titular" value={holder} fallback="NOMBRE APELLIDO" />
    </View>
  );
}

// Cheque certificado: fondo papel claro con borde, layout de cheque real.
function CheckLayout({
  bank,
  number,
  amount,
}: {
  bank: string;
  number: string;
  amount: string;
}) {
  return (
    <View className="border-neutral-300 gap-4 rounded-2xl border bg-neutral-50 p-5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon as={ScrollText} size={20} className="text-neutral-500" />
          <Text className="text-base font-semibold text-neutral-800">
            {bank || "Banco emisor"}
          </Text>
        </View>
        <Text className="text-xs text-neutral-400">
          N° {number || "••••••••"}
        </Text>
      </View>

      {/* Caja del monto, como en un cheque */}
      <View className="border-neutral-300 flex-row items-center justify-between rounded-lg border bg-white px-3 py-2">
        <Text className="text-xs uppercase text-neutral-400">Páguese</Text>
        <Text className="text-xl font-bold text-neutral-800">
          $ {amount || "0.00"}
        </Text>
      </View>

      <View className="border-neutral-300 mt-1 border-t pt-1">
        <Text className="text-[10px] text-neutral-400">Cheque certificado</Text>
      </View>
    </View>
  );
}

function PreviewField({
  label,
  value,
  fallback,
}: {
  label: string;
  value: string;
  fallback: string;
}) {
  return (
    <View className="gap-0.5">
      <Text className="text-[10px] uppercase text-white/50">{label}</Text>
      <Text className="text-sm text-white">{value || fallback}</Text>
    </View>
  );
}
