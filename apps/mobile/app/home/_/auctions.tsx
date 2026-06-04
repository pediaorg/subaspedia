import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, View } from "react-native";

import { AuctionCard } from "@/components/auction-card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";
import { toAuctions } from "@/lib/auctions";

export function AuctionsPreview() {
  const { data, isLoading, error } = api.auctions.listActive.useQuery();

  // Solo un preview: las primeras 3 subastas activas.
  const auctions = useMemo(() => toAuctions(data).slice(0, 3), [data]);

  return (
    <View className="gap-1">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-2xl font-bold">¡Última oferta!</Text>
          <Text className="text-muted-foreground text-sm">
            Subastas que podrían gustarte
          </Text>
        </View>
        <Button
          size="sm"
          className="rounded-full px-5"
          onPress={() => router.push("/auctions")}
        >
          <Text className="font-semibold text-primary-foreground">Ver más</Text>
        </Button>
      </View>

      {isLoading && <ActivityIndicator className="py-8" />}
      {error && (
        <Text className="text-destructive py-8">Error: {error.message}</Text>
      )}
      {!isLoading && !error && auctions.length === 0 && (
        <Text className="text-muted-foreground py-6">
          No hay subastas activas
        </Text>
      )}

      {auctions.map(auction => (
        <AuctionCard
          key={auction.id}
          auction={auction}
          onOpenCatalog={() => router.push("/auctions")}
          onEnter={() => router.push("/auctions")}
        />
      ))}
    </View>
  );
}
