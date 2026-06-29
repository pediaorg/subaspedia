import { useEffect, useState } from "react";
import { Dimensions, Image, Pressable, ScrollView, View } from "react-native";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import type { Product } from "@/lib/auctions";
import { useAuth } from "@/lib/auth";
import { formatMoney } from "@/lib/format";

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
        <DialogContent
          className="gap-0 bg-white p-5"
          style={{
            width: Dimensions.get("window").width - 32,
            maxHeight: Dimensions.get("window").height * 0.85,
          }}
        >
          <DialogTitle className="text-primary text-2xl font-bold">
            {product.name}
          </DialogTitle>
          <Separator className="bg-primary/40 mb-4 mt-3" />

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: Dimensions.get("window").height * 0.72 }}
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
                <View className="relative rounded-full bg-white/25 px-4 py-1 overflow-hidden">
                  {isAuthed ? (
                    <Text className="font-semibold text-white">
                      {formatMoney(product.basePrice, product.currency)}
                    </Text>
                  ) : (
                    <Text
                      className="font-semibold text-white"
                      style={{ letterSpacing: -1 }}
                    >
                      {"•".repeat(
                        Math.max(
                          5,
                          formatMoney(product.basePrice, product.currency)
                            .length,
                        ),
                      )}
                    </Text>
                  )}
                  {!isAuthed && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(255,255,255,0.45)",
                      }}
                    />
                  )}
                </View>
              </View>
              {!isAuthed && (
                <Text className="text-xs text-muted-foreground text-center -mt-1">
                  Iniciá sesión para ver el precio base.
                </Text>
              )}
            </View>
          </ScrollView>
        </DialogContent>
      )}
    </Dialog>
  );
}
