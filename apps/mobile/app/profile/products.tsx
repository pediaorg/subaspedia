import { ScrollView, Text, View } from "react-native";

import ProductCard from "@/components/profile/products/product-card";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

export default function UserProducts() {
  const { data: products, isLoading } = api.products.list.useQuery();

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
