import { router, Stack } from "expo-router";
import { Menu } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import type { Notification } from "@subaspedia/types/notification";
import { Sidebar } from "@/components/app-header/sidebar";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function NotificationRow({ notification }: { notification: Notification }) {
  return (
    <Pressable
      onPress={() => router.push(`/notifications/${notification.id}` as never)}
    >
      <Card className="bg-white drop-shadow-md/40 border-none flex-row items-center gap-4 p-4">
        <NotificationIcon route={notification.route} />
        <View className="flex-1">
          <Text
            className="text-base font-bold"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {notification.title}
          </Text>
          <Text
            className="text-sm text-gray-600"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {notification.body}
          </Text>
        </View>
        <Text className="text-xs text-gray-500">
          {formatDate(notification.createdAt)}
        </Text>
      </Card>
    </Pressable>
  );
}

export default function Notifications() {
  const { data, isLoading, error } = api.notifications.list.useQuery();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between">
          <Text variant="h1" className="text-left font-bold">
            Notificaciones
          </Text>
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
            No pudimos cargar tus notificaciones: {error.message}
          </Text>
        )}
        {!isLoading && !error && (data?.length ?? 0) === 0 && (
          <Text className="text-gray-500 text-center">
            No tenés notificaciones todavía.
          </Text>
        )}

        {data?.map(n => (
          <NotificationRow key={n.id} notification={n} />
        ))}
      </ScrollView>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
