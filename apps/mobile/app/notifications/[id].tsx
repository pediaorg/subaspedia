import { router, Stack, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Menu } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import type { NotificationRoute } from "@subaspedia/types/notification";
import { Sidebar } from "@/components/app-header/sidebar";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

// Cada tipo lleva al usuario a la pantalla relevante con un botón único:
// sanction -> ver la multa, proposal -> listado de productos del dueño (donde
// está la propuesta), paymentMethod -> medios de pago y auction -> index
// (TODO: linkear al detalle cuando el id viaje también).
//
// winProduct es la EXCEPCIÓN: no navega a una pantalla, sino que pide decidir el
// método de entrega de la obra ganada (envío / retiro). Por eso su footer se
// renderiza aparte (ver WinProductActions) y su entrada acá queda sin usar; se
// mantiene solo para satisfacer el Record completo de NotificationRoute.
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

// Footer especial para notificaciones de obra ganada (winProduct): en vez de
// navegar, el usuario elige cómo recibir la obra. La acción real (registrar el
// envío / coordinar el retiro) todavía no está definida en el back -> por ahora
// los handlers son placeholders.
function WinProductActions() {
  const choose = (method: "shipping" | "pickup") => {
    // TODO: disparar la acción real de envío/retiro cuando exista el endpoint.
    void method;
  };

  return (
    <View className="mt-4 gap-3">
      <Text className="text-center text-sm text-gray-500">
        ¿Cómo querés recibir tu obra?
      </Text>
      <View className="flex-row gap-3">
        <Button
          size="lg"
          variant="outline"
          onPress={() => choose("shipping")}
          className="flex-1 rounded-full"
        >
          <Text className="font-bold">Envío</Text>
        </Button>
        <Button
          size="lg"
          onPress={() => choose("pickup")}
          className="flex-1 rounded-full"
        >
          <Text className="font-bold text-white">Ir a buscarlo</Text>
        </Button>
      </View>
    </View>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);

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
        <View className="flex-row items-center justify-between">
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
            <Text variant="h3" className="font-bold">
              Notificación
            </Text>
          </View>
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Abrir menú"
            hitSlop={8}
          >
            <Icon as={Menu} size={28} className="text-foreground" />
          </Pressable>
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

            {data.route === "winProduct" ? (
              <WinProductActions />
            ) : (
              <Button
                size="lg"
                onPress={() => router.push(TARGET[data.route].href as never)}
                className="self-center mt-4 rounded-full px-8"
              >
                <Text className="font-bold text-white">
                  {TARGET[data.route].label}
                </Text>
              </Button>
            )}
          </View>
        )}
      </ScrollView>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
