import { Menu } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

import { Sidebar } from "./sidebar";

export function AppHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <View className="flex-row items-center justify-end px-4 py-4">
        {/* TODO: Acá podríamos poner el el botón para ir atrás y el header de cada pantalla*/}
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityLabel="Abrir menú"
          hitSlop={8}
        >
          <Icon as={Menu} size={28} className="text-foreground" />
        </Pressable>
      </View>

      <Sidebar open={open} onClose={() => setOpen(false)} />
    </>
  );
}
