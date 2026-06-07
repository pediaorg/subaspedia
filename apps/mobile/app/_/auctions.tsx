import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { AuctionCard } from "@/components/auction-card";
import { CatalogDialog } from "@/components/auctions/catalog-dialog";
import { ProductDialog } from "@/components/auctions/product-dialog";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";
import { type Product, toAuctions } from "@/lib/auctions";
import { photoUri } from "@/lib/photo";

export function AuctionsPreview() {
  const { data, isLoading, error } = api.auctions.listActive.useQuery();
  const [catalogAuctionId, setCatalogAuctionId] = useState<number | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  const { data: catalogData } = api.auctions.listCatalog.useQuery(
    { auctionId: catalogAuctionId ?? 0 },
    { enabled: catalogAuctionId !== null },
  );

  const catalogProducts = useMemo<Product[]>(
    () =>
      (catalogData ?? []).map(p => {
        const images = p.photoIds
          .map(id => photoUri(id))
          .filter((u): u is string => u !== null);
        const base = {
          id: String(p.id),
          name: p.name,
          category: p.catalogDescription ?? "",
          image: photoUri(p.photoId) ?? "https://placehold.co/600x400",
          images,
          description: p.description ?? "",
          currentOwner: p.ownerName ?? "—",
          basePrice: p.basePrice,
        };
        if (p.kind === "artwork") {
          return {
            ...base,
            kind: "artwork" as const,
            artist: p.artist ?? "—",
            date: p.creationDate ?? "—",
            history: p.history ?? "",
          };
        }
        return { ...base, kind: "object" as const };
      }),
    [catalogData],
  );

  // Solo un preview: las primeras 3 subastas activas.
  const auctions = useMemo(() => toAuctions(data).slice(0, 3), [data]);

  const handleSelectProduct = (product: Product) => {
    setCatalogAuctionId(null);
    setDetailProduct(product);
  };

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
          onOpenCatalog={() => setCatalogAuctionId(Number(auction.id))}
          onEnter={() => router.push("/auctions")}
        />
      ))}

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
    </View>
  );
}
