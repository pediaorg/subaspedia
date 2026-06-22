import { useRouter } from "expo-router";
import { Image, Pressable, Text, View } from "react-native";

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
    <View className="w-full mt-3 mb-5 drop-shadow-xl/50 rounded-md bg-white transition delay-150 duration-300 ease-in-out hover:-translate-y-1 active:-translate-y-1">
      <Image
        source={{ uri: auction.images[0] ?? "https://placehold.co/800x600" }}
        className="w-full h-40 rounded-t-md"
      />
      {/* Rango de la subasta, esquina superior derecha. */}
      <View className="absolute right-2 top-2 z-10">
        <RankBadge category={RANK_TO_CATEGORY[auction.rank]} />
      </View>
      <View className="h-12 bg-primary flex flex-row rounded-b-md justify-between items-center px-4 shadow-[0px_-4px_8px_rgba(0,0,0,0.30)]">
        <Pressable className="p-1" hitSlop={8} onPress={onOpenCatalog}>
          <Text className="text-white font-bold">Catálogo</Text>
          <View className="flex flex-row">
            {auction.images.map((uri, index) => (
              <Image
                key={uri}
                source={{ uri }}
                className={`w-6 h-6 rounded-full border border-primary drop-shadow-lg ${
                  index === 0 ? "" : "-ml-2"
                }`}
              />
            ))}
          </View>
        </Pressable>
        <Button
          className="border-border h-8 bg-white rounded-full drop-shadow-lg hover:bg-white/90 active:bg-white/90 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary/80"
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
          Entrar
        </Button>
      </View>
    </View>
  );
}
