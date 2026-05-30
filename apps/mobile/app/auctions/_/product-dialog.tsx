import { Image, ScrollView, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";

import type { Product } from "./catalog-mock";

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function formatPrice(amount: number): string {
  return priceFormatter.format(amount);
}

type ProductDialogProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex flex-row items-center justify-between gap-3">
      <Text className="text-primary text-lg font-bold">{label}</Text>
      <Text className="text-foreground flex-1 text-right">{value}</Text>
    </View>
  );
}

function TextSection({ title, body }: { title: string; body: string }) {
  return (
    <View className="gap-1">
      <Text className="text-foreground text-lg font-bold">{title}</Text>
      <Text className="text-muted-foreground">{body}</Text>
    </View>
  );
}

function Thumbnails({ images }: { images: string[] }) {
  return (
    <View className="flex flex-row gap-2">
      {images.map(uri => (
        <Image key={uri} source={{ uri }} className="h-20 flex-1 rounded-lg" />
      ))}
    </View>
  );
}

export function ProductDialog({
  product,
  open,
  onOpenChange,
}: ProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {product && (
        <DialogContent className="max-h-[85vh] w-full gap-0 bg-white p-5 sm:max-w-xl">
          <DialogTitle className="text-primary text-2xl font-bold">
            {product.name}
          </DialogTitle>
          <Separator className="bg-primary/40 mb-4 mt-3" />

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="min-h-0 flex-1"
            contentContainerClassName="gap-4 pb-1"
          >
            <Image
              source={{ uri: product.image }}
              className="h-56 w-full rounded-xl"
            />
            <Thumbnails images={product.images} />

            <View className="border-gray-200 gap-4 rounded-2xl border bg-white p-4 shadow-sm shadow-black/10">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-primary text-xl font-bold">
                  Nro de pieza
                </Text>
                <Button variant="outline" size="sm" className="rounded-lg">
                  <Text>{product.pieceNumber}</Text>
                </Button>
              </View>
              <Separator className="bg-primary/40" />

              <TextSection title="Descripción" body={product.description} />

              {product.kind === "artwork" && (
                <>
                  <FieldRow label="Artista" value={product.artist} />
                  <FieldRow label="Fecha" value={product.date} />
                </>
              )}

              <FieldRow label="Dueño actual" value={product.currentOwner} />

              {product.kind === "artwork" && (
                <TextSection title="Historia" body={product.history} />
              )}

              <View className="bg-primary flex flex-row items-center justify-between rounded-full px-4 py-2.5">
                <Text className="text-lg font-bold text-white">
                  Precio base
                </Text>
                <View className="rounded-full bg-white/25 px-4 py-1">
                  <Text className="font-semibold text-white">
                    {formatPrice(product.basePrice)}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center justify-between">
                <Text className="text-primary text-xl font-bold">
                  Compuesto por
                </Text>
                <View className="border-border rounded-lg border px-5 py-1">
                  <Text className="text-foreground">{product.composedOf}</Text>
                </View>
              </View>

              <Thumbnails images={product.composedImages} />
            </View>
          </ScrollView>
        </DialogContent>
      )}
    </Dialog>
  );
}
