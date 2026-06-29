import { useRouter } from "expo-router";
import { Image, Pressable, Text as RNText, View } from "react-native";

import { Text } from "@/components/ui/text";

import RankBadge from "@/components/profile/rank-badge";
import { Button } from "@/components/ui/button";
import { type Auction, RANK_TO_CATEGORY } from "@/lib/auctions";

type AuctionCardProps = {
  auction: Auction;
  onOpenCatalog: () => void;
  onEnter?: () => void;
};

export function AuctionCard({
  auction,
  onOpenCatalog,
  onEnter,
}: AuctionCardProps) {
  const router = useRouter();

  return (
    <View className="w-full mt-3 mb-5 drop-shadow-xl/50 rounded-md bg-white overflow-hidden transition delay-150 duration-300 ease-in-out hover:-translate-y-1 active:-translate-y-1">
      <Image
        source={{ uri: auction.images[0] ?? "https://placehold.co/800x600" }}
        className="w-full h-48 rounded-t-md bg-gray-200"
        resizeMode="cover"
      />
      {/* Rango de la subasta, esquina superior derecha. */}
      <View className="absolute right-2 top-2 z-10">
        <RankBadge category={RANK_TO_CATEGORY[auction.rank]} />
      </View>
      <View className="bg-primary flex-row rounded-b-md items-center px-4 py-3 gap-3 shadow-[0px_-4px_8px_rgba(0,0,0,0.30)]">
        <Pressable
          className="flex-row items-center gap-2 flex-1"
          hitSlop={8}
          onPress={onOpenCatalog}
        >
          <RNText className="text-white font-bold">Catálogo</RNText>
          <View className="flex-row">
            {auction.images.slice(0, 4).map((uri, index) => (
              <Image
                key={uri}
                source={{ uri }}
                className={`w-6 h-6 rounded-full border-2 border-white bg-gray-200 ${
                  index === 0 ? "" : "-ml-2"
                }`}
              />
            ))}
          </View>
        </Pressable>
        <Button
          className="border border-border h-9 px-5 bg-white rounded-full drop-shadow-lg hover:bg-white/90 active:bg-white/90"
          size="sm"
          onPress={() => {
            // Si pasaste una función desde el padre (index.tsx), la ejecuta.
            // Si no, hace la navegación estándar.
            if (onEnter) {
              onEnter();
            } else {
              router.push(`/auctions/${auction.id}`);
            }
          }}
        >
          <Text className="text-primary font-bold">Entrar</Text>
        </Button>
      </View>
    </View>
  );
}
