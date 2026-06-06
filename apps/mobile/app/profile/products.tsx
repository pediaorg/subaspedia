import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import type { Product } from "@subaspedia/types/product";
import ProductCard from "@/components/profile/products/product-card";
import { Separator } from "@/components/ui/separator";

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Reloj de bolsillo siglo XIX",
    status: "appraised",
    img: "https://picsum.photos/seed/reloj/200",
    proposalText:
      "Pieza en muy buen estado de conservación. Tasada para incluir en la próxima subasta de antigüedades.",
    proposedBasePrice: 180000,
    proposedCommission: 12,
    salePrice: null,
    saleDate: null,
    auctionId: null,
  },
  {
    id: 2,
    name: "Óleo sobre tela - paisaje",
    status: "under_review",
    img: "https://picsum.photos/seed/oleo/200",
    proposalText: null,
    proposedBasePrice: null,
    proposedCommission: null,
    salePrice: null,
    saleDate: null,
    auctionId: null,
  },
  {
    id: 3,
    name: "Vajilla de porcelana Limoges",
    status: "auctioned",
    img: "https://picsum.photos/seed/vajilla/200",
    proposalText: null,
    proposedBasePrice: null,
    proposedCommission: null,
    salePrice: 320000,
    saleDate: new Date().toISOString(),
    auctionId: 5,
  },
  {
    id: 4,
    name: "Escultura de bronce",
    status: "rejected",
    img: "https://picsum.photos/seed/escultura/200",
    proposalText: null,
    proposedBasePrice: null,
    proposedCommission: null,
    salePrice: null,
    saleDate: null,
    auctionId: null,
  },
];

export default function UserProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      // TODO: reemplazar por la llamada real al back (GET /products)
      await new Promise(r => setTimeout(r, 300));
      return MOCK_PRODUCTS;
    },
  });

  return (
    <View className="flex-1 px-4 gap-5">
      <View className="gap-4">
        <Text className="font-bold text-3xl">Mis Productos</Text>
        <Separator className="bg-gray-500" />
      </View>

      {isLoading && <Text className="text-gray-500">Cargando…</Text>}

      {!isLoading && products?.length === 0 && (
        <Text className="text-gray-500 text-center">
          Todavía no tenés productos. Ofrecé un bien desde el menú principal.
        </Text>
      )}

      <ScrollView contentContainerClassName="gap-6 pb-6">
        {products?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    </View>
  );
}
