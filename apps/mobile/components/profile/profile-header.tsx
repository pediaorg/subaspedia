import { router, usePathname } from "expo-router";
import { ArrowLeft, ArrowLeftCircle, Menu } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Sidebar } from "@/components/app-header/sidebar";

export default function ProfileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Desde el index del perfil "atrás" va a la landing (no hay pantalla previa
  // del perfil donde volver); en el resto de pantallas vuelve a la anterior.
  const handleBack = () => {
    if (pathname === "/profile") router.replace("/");
    else router.back();
  };

  return (
    <View className="flex-row justify-between items-center py-14 px-6">
      <Pressable onPress={handleBack}>
        <View
          className="items-center justify-center size-10 rounded-full bg-white"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <ArrowLeft className="" />
        </View>
      </Pressable>
      <Pressable
        onPress={() => setMenuOpen(true)}
        accessibilityLabel="Abrir menú"
      >
        <Menu />
      </Pressable>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
