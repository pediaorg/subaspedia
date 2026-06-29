import { router, Stack, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Menu } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import type { Notification } from "@subaspedia/types/notification";
import { Sidebar } from "@/components/app-header/sidebar";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

// Resuelve el destino del botón del detalle según el tipo de notificación.
// winProduct (obra ganada) es DECORATIVA: devuelve null y el detalle no muestra
// botón. El aviso de la obra ganada y la acción real (ver la compra y elegir
// envío / retiro) llegan por EMAIL, que linkea directo a la transacción.
// Los demás tipos navegan a una pantalla fija: sanction -> multas,
// proposal -> mis productos, paymentMethod -> medios de pago, auction -> index.
function resolveTarget(
  n: Notification,
): { href: string; label: string } | null {
  switch (n.route) {
    case "winProduct":
      return null;
    case "sanction":
      return { href: "/profile/infractions", label: "Ver multas y pagos" };
    case "proposal":
      return { href: "/profile/products", label: "Ver mis productos" };
    case "paymentMethod":
      return {
        href: "/profile/payment-methods",
        label: "Ver mis medios de pago",
      };
    case "auction":
      return { href: "/auctions", label: "Ver subastas" };
  }
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

            {(() => {
              const target = resolveTarget(data);
              if (!target) return null;
              return (
                <Button
                  size="lg"
                  onPress={() => router.push(target.href as never)}
                  className="self-center mt-4 h-12 rounded-full px-8"
                >
                  <Text numberOfLines={1} className="font-bold text-white">
                    {target.label}
                  </Text>
                </Button>
              );
            })()}
          </View>
        )}
      </ScrollView>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
