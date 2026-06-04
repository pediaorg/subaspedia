import { Menu } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { Sidebar } from "@/components/app-header/sidebar";
import { SearchBar } from "@/components/search-bar";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

import { AuctionsPreview } from "./_/auctions";
import { FeaturedCarousel } from "./_/featured-carousel";

export default function HomeScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 p-4 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="text-3xl font-extrabold">Subaspedia</Text>
            <Text className="text-muted-foreground text-sm font-semibold">
              Tu página de subastas favorita
            </Text>
          </View>
          <Pressable
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Abrir menú"
            hitSlop={8}
            className="pt-1"
          >
            <Icon as={Menu} size={28} className="text-foreground" />
          </Pressable>
        </View>

        <SearchBar />
        <FeaturedCarousel />
        <AuctionsPreview />
      </ScrollView>

      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
