import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import type { Product } from "@/lib/auctions";
import { useAuth } from "@/lib/auth";

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

function Thumbnails({
  images,
  selected,
  onSelect,
}: {
  images: string[];
  selected: string;
  onSelect: (uri: string) => void;
}) {
  return (
    <View className="flex flex-row gap-2">
      {images.map(uri => (
        <Pressable key={uri} className="flex-1" onPress={() => onSelect(uri)}>
          <Image
            source={{ uri }}
            className={`h-20 w-full rounded-lg drop-shadow-sm/30 ${
              uri === selected ? "border-primary border-2" : ""
            }`}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function ProductDialog({
  product,
  open,
  onOpenChange,
}: ProductDialogProps) {
  const { isAuthed } = useAuth();
  const [mainImage, setMainImage] = useState(product?.image ?? "");

  useEffect(() => {
    if (product) setMainImage(product.image);
  }, [product]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {product && (
        <DialogContent className="max-h-[85vh] w-[92vw] max-w-[92vw] gap-0 bg-white p-5">
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
              source={{ uri: mainImage }}
              className="h-56 w-full rounded-xl drop-shadow-sm/30"
            />
            <Thumbnails
              images={product.images}
              selected={mainImage}
              onSelect={setMainImage}
            />

            <View className="border-gray-200 gap-4 rounded-2xl border bg-white p-4 shadow-sm shadow-black/10">
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
                  <Text
                    className="font-semibold text-white"
                    style={
                      isAuthed
                        ? undefined
                        : {
                            color: "transparent",
                            textShadowColor: "rgba(255,255,255,0.95)",
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 8,
                          }
                    }
                  >
                    {formatPrice(product.basePrice)}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </DialogContent>
      )}
    </Dialog>
  );
}
