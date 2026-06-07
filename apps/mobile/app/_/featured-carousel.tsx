import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";

import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";
import { photoUri } from "@/lib/photo";
import { cn } from "@/lib/utils";

type FeaturedItem = {
  id: string;
  auctionId: number;
  title: string;
  description: string;
  image: string;
};

const CARD_HEIGHT = 256;

// TODO: cambiar este push. Por ahora lleva a /auctions pasando el id como parámetro.
function goToAuction(auctionId: number) {
  router.push({
    pathname: "/auctions",
    params: { auctionId: String(auctionId) },
  });
}

export function FeaturedCarousel() {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const { data, isLoading } = api.auctions.listFeatured.useQuery();

  const items = useMemo<FeaturedItem[]>(
    () =>
      (data ?? []).map(p => ({
        id: String(p.id),
        auctionId: p.auctionId,
        title: p.title,
        description: p.description ?? "",
        image: photoUri(p.photoId) ?? "https://placehold.co/800x600",
      })),
    [data],
  );

  // -mx-4 (full-bleed) + px-2 -> el marco mide width - 16
  const frameWidth = width - 16;

  if (isLoading) {
    return (
      <View className="-mx-4 px-2 pb-6 pt-2">
        <View
          style={{ height: CARD_HEIGHT }}
          className="items-center justify-center overflow-hidden rounded-2xl bg-secondary"
        >
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  if (items.length === 0) return null;

  const current = items[index] ?? items[0];

  return (
    <View className="-mx-4 px-2 pb-6 pt-2">
      {/* marco fijo: no se mueve */}
      <View
        style={{ height: CARD_HEIGHT }}
        className="drop-shadow-xl/40 overflow-hidden rounded-2xl bg-white"
      >
        {/* solo las imágenes se deslizan adentro del marco */}
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={e => {
            const i = Math.round(e.nativeEvent.contentOffset.x / frameWidth);
            if (i !== index) setIndex(i);
          }}
          renderItem={({ item }) => (
            <Pressable onPress={() => goToAuction(item.auctionId)}>
              <Image
                source={{ uri: item.image }}
                style={{ width: frameWidth, height: CARD_HEIGHT }}
                contentFit="cover"
              />
            </Pressable>
          )}
        />

        {/* overlay fijo: texto + puntos, no se mueve con el scroll */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          pointerEvents="none"
          className="absolute inset-x-0 bottom-0 p-4 pt-12"
        >
          <Text className="text-2xl font-bold text-white">{current.title}</Text>
          <Text className="text-xs leading-4 text-white/90">
            {current.description}
          </Text>

          <View className="mt-3 flex-row justify-center gap-2">
            {items.map((dot, i) => (
              <View
                key={dot.id}
                className={cn(
                  "h-2 w-2 rounded-full",
                  i === index ? "bg-primary" : "bg-white/50",
                )}
              />
            ))}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}
