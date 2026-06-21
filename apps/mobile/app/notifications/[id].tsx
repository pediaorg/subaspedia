import { router, Stack, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";

import type { NotificationRoute } from "@subaspedia/types/notification";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

// Cada tipo lleva al usuario a la pantalla relevante. winProduct y sanction
// caen en la misma vista de "Multas y pagos" (winProduct -> ver el cobro,
// sanction -> ver la multa); proposal va al listado de productos del dueño
// (donde está la propuesta de cotización), paymentMethod a los medios de pago
// y auction al index (TODO: linkear al detalle cuando el id viaje también).
const TARGET: Record<NotificationRoute, { href: string; label: string }> = {
  paymentMethod: {
    href: "/profile/payment-methods",
    label: "Ver mis medios de pago",
  },
  proposal: {
    href: "/profile/products",
    label: "Ver mis productos",
  },
  sanction: {
    href: "/profile/infractions",
    label: "Ver multas y pagos",
  },
  winProduct: {
    href: "/profile/infractions",
    label: "Ver multas y pagos",
  },
  auction: {
    href: "/auctions",
    label: "Ver subastas",
  },
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);

  const { data, isLoading, error } = api.notifications.get.useQuery(
    { id: numericId },
    { enabled: Number.isFinite(numericId) && numericId > 0 },
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 p-4 pb-12"
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="size-10 items-center justify-center rounded-full bg-white"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4,
            }}
            accessibilityLabel="Volver"
          >
            <ArrowLeft />
          </Pressable>
          <Text variant="h2" className="font-bold">
            Notificación
          </Text>
        </View>

        <Separator className="bg-[#D9D9D9]" />

        {isLoading && <Text className="text-gray-500">Cargando…</Text>}
        {error && (
          <Text className="text-red-500">
            No pudimos cargar la notificación: {error.message}
          </Text>
        )}

        {data && (
          <View className="gap-5">
            <View className="items-center gap-3">
              <NotificationIcon route={data.route} size="lg" />
              <Text className="text-2xl text-center font-bold">
                {data.title}
              </Text>
              <Text className="text-sm text-gray-500">
                {formatDateTime(data.createdAt)}
              </Text>
            </View>

            <Text className="text-base leading-6">{data.body}</Text>

            <Button
              size="lg"
              onPress={() => router.push(TARGET[data.route].href as never)}
              className="self-center mt-4 rounded-full px-8"
            >
              <Text className="font-bold text-white">
                {TARGET[data.route].label}
              </Text>
            </Button>
          </View>
        )}
      </ScrollView>
    </>
  );
}
