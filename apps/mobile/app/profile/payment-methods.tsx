import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { Alert, ScrollView, Text, View } from "react-native";

import PaymentMethodCard from "@/components/profile/payment-methods/payment-method-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

export default function PaymentMethods() {
  const queryClient = useQueryClient();

  // GET real: lista los medios de pago del usuario logueado (user.listPaymentMethods).
  const { data: methods, isLoading } = api.user.listPaymentMethods.useQuery();

  const { mutate: deleteMethod } = api.user.deletePaymentMethod.useMutation({
    onSuccess: () => {
      // Refresca el listado real (mismo queryKey que usa el GET de arriba).
      queryClient.invalidateQueries({
        queryKey: api.user.listPaymentMethods.queryKey(),
      });
    },
    onError: error => Alert.alert("Error", error.message),
  });

  function handleAdd() {
    // Form de alta existente (pega a user.addPaymentMethod). Al volver, su
    // onSuccess invalida este listado para que aparezca el nuevo medio.
    router.push("/payment-method");
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

      <ScrollView className="-mx-4" contentContainerClassName="gap-4 px-4 pb-6">
        {methods?.map(method => (
          <PaymentMethodCard
            key={method.id}
            method={method}
            onDelete={id => deleteMethod({ id })}
          />
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
