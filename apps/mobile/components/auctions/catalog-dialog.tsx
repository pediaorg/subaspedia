import { Dimensions, Image, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import type { Product } from "@/lib/auctions";

type CatalogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
};

export function CatalogDialog({
  open,
  onOpenChange,
  products,
  onSelectProduct,
}: CatalogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 bg-white p-5"
        style={{
          width: Dimensions.get("window").width - 32,
          maxHeight: Dimensions.get("window").height * 0.8,
        }}
      >
        <DialogTitle className="text-primary text-center text-2xl font-bold">
          Catálogo
        </DialogTitle>
        <Separator className="bg-primary/40 mb-4 mt-3" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: Dimensions.get("window").height * 0.66 }}
          contentContainerClassName="gap-4 pb-1"
        >
          {products.length === 0 ? (
            <Text className="text-muted-foreground text-center py-6">
              No hay productos en este catálogo.
            </Text>
          ) : (
            products.map(product => (
              <View
                key={product.id}
                className="flex-row gap-3 rounded-2xl bg-white p-3 shadow-md shadow-black/10 border border-gray-100"
              >
                <Image
                  source={{ uri: product.image }}
                  className="rounded-xl w-24 h-24 bg-gray-200"
                />
                <View className="flex-1 justify-center gap-1">
                  <Text
                    className="text-foreground text-base font-bold"
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>
                  <Text
                    className="text-muted-foreground text-sm"
                    numberOfLines={2}
                  >
                    {product.category}
                  </Text>
                  <Button
                    className="bg-primary mt-2 self-start rounded-lg h-9 px-5"
                    onPress={() => onSelectProduct(product)}
                  >
                    <Text
                      numberOfLines={1}
                      className="font-semibold text-white"
                    >
                      Ver más
                    </Text>
                  </Button>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}
