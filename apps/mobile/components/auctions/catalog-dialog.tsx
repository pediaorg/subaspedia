import { Image, ScrollView, View } from "react-native";

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
      <DialogContent className="max-h-[85vh] w-full gap-0 bg-white p-5 sm:max-w-2xl">
        <DialogTitle className="text-primary text-center text-2xl font-bold">
          Catálogo
        </DialogTitle>
        <Separator className="bg-primary/40 mb-4 mt-3" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="min-h-0 flex-1"
          contentContainerClassName="gap-4 pb-1"
        >
          {products.map(product => (
            <View
              key={product.id}
              className="flex flex-row gap-3 rounded-2xl bg-white p-3 shadow-md shadow-black/10"
            >
              <Image
                source={{ uri: product.image }}
                className="rounded-xl size-30"
              />
              <View className="flex-1 justify-center gap-1">
                <Text className="text-foreground text-lg font-bold">
                  {product.name}
                </Text>
                <Text className="text-muted-foreground">
                  {product.category}
                </Text>
                <Button
                  className="bg-primary sm:mt-2 self-start rounded-lg "
                  onPress={() => onSelectProduct(product)}
                >
                  <Text className="font-semibold">Ver más...</Text>
                </Button>
              </View>
            </View>
          ))}
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}
