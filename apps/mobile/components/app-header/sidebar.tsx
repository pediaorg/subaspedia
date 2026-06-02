import { Portal } from "@rn-primitives/portal";
import { type Href, useRouter } from "expo-router";
import { User } from "lucide-react-native";
import { useEffect } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth";

import { Card } from "../ui/card";
import { sidebarItems } from "./items";
import { SidebarItem } from "./sidebar-item";

// TODO: reemplazar por los datos reales del usuario cuando esté el backend.
const userName = "Name user";
const userAvatarUrl: string | undefined = undefined;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const router = useRouter();
  const { isAuthed } = useAuth();
  const { width } = useWindowDimensions();
  const panelWidth = width * 0.5;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: 250 });
  }, [open, progress]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(progress.value, [0, 1], [panelWidth, 0]),
      },
    ],
  }));

  const go = (href: Href) => {
    onClose();
    router.push(href);
  };

  return (
    <Portal name="app-sidebar">
      <View
        pointerEvents={open ? "auto" : "none"}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
          <Pressable
            onPress={onClose}
            className="flex-1 bg-black/50"
            accessibilityLabel="Cerrar menú"
          />
        </Animated.View>

        <Animated.View
          style={[styles.panel, { width: panelWidth }, panelStyle]}
          className="bg-white items-center"
        >
          {isAuthed ? (
            <Pressable
              onPress={() => go("/profile")}
              accessibilityLabel="Ver perfil"
              className="items-center px-5 pt-14 pb-4"
            >
              <Avatar
                alt="Avatar del usuario"
                className="h-20 w-20 border-2 border-border"
              >
                <AvatarImage source={{ uri: userAvatarUrl }} />
                <AvatarFallback>
                  <Icon as={User} size={32} className="text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <Text className="mt-3 text-lg font-semibold">{userName}</Text>
            </Pressable>
          ) : (
            <View className="items-center px-5 pt-14 pb-4">
              <Avatar
                alt="Avatar default"
                className="h-20 w-20 border-2 border-border"
              >
                <AvatarFallback>
                  <Icon as={User} size={32} className="text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </View>
          )}

          <Separator className="border-border w-2/3 mb-3" />

          <View className="self-center">
            {sidebarItems().map(item => (
              <SidebarItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                onPress={() => go(item.href)}
              />
            ))}
          </View>

          {!isAuthed && (
            <>
              <Separator className="mt-3 border-border w-2/3 mb-4" />
              <View className="mt-3 items-center">
                <Button variant="outline" onPress={() => go("/login")}>
                  <Text>Iniciar sesión</Text>
                </Button>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
  },
});
