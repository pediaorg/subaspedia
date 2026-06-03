import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

import { AuctionCard } from "./_/auction-card";
import type { Auction, Ranks } from "./_/auctions-mock";
import { CatalogDialog } from "./_/catalog-dialog";
import type { Product } from "./_/catalog-mock";
import { ProductDialog } from "./_/product-dialog";
import { RankFilter } from "./_/rank-filter";

const CATEGORY_TO_RANK: Record<string, Ranks> = {
  common: "Común",
  special: "Especial",
  silver: "Plata",
  gold: "Oro",
  platinum: "Platino",
};

export default function AuctionsScreen() {
  const [search, setSearch] = useState("");
  const [ranks, setRanks] = useState<Ranks[]>([]);
  const [catalogAuctionId, setCatalogAuctionId] = useState<number | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const { data, isLoading, error } = api.auctions.listActive.useQuery();

  const { data: catalogData } = api.auctions.listCatalog.useQuery(
    { auctionId: catalogAuctionId ?? 0 },
    { enabled: catalogAuctionId !== null },
  );

  const catalogProducts = useMemo<Product[]>(
    () =>
      (catalogData ?? []).map(p => ({
        kind: "object" as const,
        id: String(p.id),
        name: p.name,
        category: p.catalogDescription ?? "",
        image: p.image ?? "https://placehold.co/600x400",
        images: p.images,
        description: p.description ?? "",
        currentOwner: p.ownerName ?? "—",
        basePrice: p.basePrice,
      })),
    [catalogData],
  );

  const auctions = useMemo<Auction[]>(
    () =>
      (data ?? []).map(a => ({
        id: String(a.id),
        name: a.location ?? "",
        rank: a.category ? CATEGORY_TO_RANK[a.category] : "Común",
        images: a.images ?? [],
      })),
    [data],
  );

  const toggleRank = (c: Ranks) =>
    setRanks(prev =>
      prev.includes(c) ? prev.filter(r => r !== c) : [...prev, c],
    );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return auctions.filter(a => {
      const matchesText = !q || a.name.toLowerCase().includes(q);
      const matchesRank = ranks.length === 0 || ranks.includes(a.rank);
      return matchesText && matchesRank;
    });
  }, [auctions, search, ranks]);

  const handleSelectProduct = (product: Product) => {
    setCatalogAuctionId(null);
    setDetailProduct(product);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1"
        contentContainerClassName=" p-4 pb-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold">Subastas</Text>
        </View>
        <Input
          placeholder="Buscar subastas..."
          className="border-none bg-primary mb-4"
          value={search}
          onChangeText={setSearch}
        />

        <RankFilter selected={ranks} onToggle={toggleRank} />

        <Separator className="bg-gray-300" />

        <View className="justify-center items-center w-full mt-2">
          {isLoading && <ActivityIndicator className="py-8" />}
          {error && (
            <Text className="text-red-500 py-8">Error: {error.message}</Text>
          )}
          {!isLoading && !error && filtered.length === 0 && (
            <Text className="text-muted-foreground py-8">
              No se encontraron subastas
            </Text>
          )}

          {filtered.map(auction => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onOpenCatalog={() => setCatalogAuctionId(Number(auction.id))}
            />
          ))}
        </View>
      </ScrollView>

      <CatalogDialog
        open={catalogAuctionId !== null}
        onOpenChange={open => !open && setCatalogAuctionId(null)}
        products={catalogProducts}
        onSelectProduct={handleSelectProduct}
      />

      <ProductDialog
        product={detailProduct}
        open={detailProduct !== null}
        onOpenChange={open => !open && setDetailProduct(null)}
      />
    </>
  );
}
