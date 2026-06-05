import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react-native";
import { Alert, ScrollView, Text, View } from "react-native";

import type { PaymentMethod } from "@subaspedia/types/payment-method";
import PaymentMethodCard from "@/components/profile/payment-methods/payment-method-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 1,
    type: "credit_card",
    scope: "local",
    holderName: "Juan Casablanca",
    verified: true,
    brand: "Visa",
    last4: "4242",
  },
  {
    id: 2,
    type: "bank_account",
    scope: "local",
    holderName: "Juan Casablanca",
    verified: false,
    bankName: "Banco Nación",
    accountNumber: "0110599520000001234567",
  },
  {
    id: 3,
    type: "certified_check",
    holderName: "Juan Casablanca",
    verified: false,
    bankName: "Banco Galicia",
    checkNumber: "00012345",
  },
];

export default function PaymentMethods() {
  const { data: methods, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      // TODO: reemplazar por la llamada real (GET /users/me/payment-methods)
      await new Promise(r => setTimeout(r, 300));
      return MOCK_PAYMENT_METHODS;
    },
  });

  function handleAdd() {
    // TODO: navegar al form de alta (POST /users/me/payment-methods)
    Alert.alert("TODO", "Form de alta de medio de pago no implementado");
  }

  return (
    <View className="flex-1 px-4 gap-5">
      <View className="gap-4">
        <Text className="font-bold text-3xl">Métodos de pago</Text>
        <Separator className="bg-gray-500" />
      </View>

      {isLoading && <Text className="text-gray-500">Cargando…</Text>}

      {!isLoading && methods?.length === 0 && (
        <Text className="text-gray-500 text-center">
          Todavía no cargaste ningún medio de pago. Agregá uno para poder pujar.
        </Text>
      )}

      <ScrollView contentContainerClassName="gap-4 pb-6">
        {methods?.map(method => (
          <PaymentMethodCard key={method.id} method={method} />
        ))}

        <Button
          variant="outline"
          size="sm"
          onPress={handleAdd}
          className="self-center rounded-md mt-1"
        >
          <Icon as={Plus} size={16} className="text-gray-700" />
          <Text className="text-sm text-gray-700">Agregar</Text>
        </Button>
      </ScrollView>
    </View>
  );
}
