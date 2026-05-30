import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { AuctionCard } from "./_/auction-card";
import { AUCTIONS, type Ranks } from "./_/auctions-mock";
import { CatalogDialog } from "./_/catalog-dialog";
import { MOCK_PRODUCTS, type Product } from "./_/catalog-mock";
import { ProductDialog } from "./_/product-dialog";
import { RankFilter } from "./_/rank-filter";

export default function AuctionsScreen() {
  const [search, setSearch] = useState("");
  const [ranks, setRanks] = useState<Ranks[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const toggleRank = (c: Ranks) =>
    setRanks(prev =>
      prev.includes(c) ? prev.filter(r => r !== c) : [...prev, c],
    );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return AUCTIONS.filter(a => {
      const matchesText = !q || a.name.toLowerCase().includes(q);
      const matchesRank = ranks.length === 0 || ranks.includes(a.rank);
      return matchesText && matchesRank;
    });
  }, [search, ranks]);

  const handleSelectProduct = (product: Product) => {
    setCatalogOpen(false);
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
          {filtered.length === 0 && (
            <Text className="text-muted-foreground py-8">
              No se encontraron subastas
            </Text>
          )}

          {filtered.map(auction => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onOpenCatalog={() => setCatalogOpen(true)}
            />
          ))}
        </View>
      </ScrollView>

      <CatalogDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        products={MOCK_PRODUCTS}
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
