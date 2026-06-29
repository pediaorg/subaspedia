import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ProductCard from "@/components/profile/products/product-card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

export default function UserProducts() {
  const { data: products, isLoading } = api.products.list.useQuery();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 px-4 gap-5">
      <View className="gap-4">
        <Text className="font-bold text-3xl">Mis Productos</Text>
        <Separator className="bg-border" />
      </View>

      {isLoading && <Text className="text-gray-500">Cargando…</Text>}

      {!isLoading && products?.length === 0 && (
        <Text className="text-gray-500 text-center">
          Todavía no tenés productos. Ofrecé un bien desde el menú principal.
        </Text>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 96, gap: 20 }}
      >
        {products?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    </View>
  );
}
