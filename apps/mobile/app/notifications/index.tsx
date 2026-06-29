import { router, Stack } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

import type { Notification } from "@subaspedia/types/notification";
import { BackButton } from "@/components/app-header/back-button";
import { MenuButton } from "@/components/app-header/menu-button";
import { NotificationIcon } from "@/components/notifications/notification-icon";
import { Card } from "@/components/ui/card";
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
      <Card className="bg-white drop-shadow-md/40 border-0 flex-row items-center gap-4 p-4">
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <BackButton />
            <Text variant="h3" className="text-left font-bold">
              Notificaciones
            </Text>
          </View>
          <MenuButton />
        </View>
        <Separator className="bg-border" />

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
    </>
  );
}
