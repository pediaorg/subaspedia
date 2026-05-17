import {
  MIN_PRODUCT_IMAGES,
  type NewProductFormInput,
} from "@subaspedia/types/forms/new-product";
import * as React from "react";
import {
  type FieldErrors,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { View } from "react-native";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

import { ImageSlot } from "./image-slot";

export function ImagesSection({
  watch,
  setValue,
  errors,
}: {
  watch: UseFormWatch<NewProductFormInput>;
  setValue: UseFormSetValue<NewProductFormInput>;
  errors: FieldErrors<NewProductFormInput>;
}) {
  const images = watch("images") ?? [];
  const slots = React.useMemo(
    () =>
      Array.from({ length: MIN_PRODUCT_IMAGES }, (_, i) => ({
        id: `slot-${i}`,
        uri: images[i] ?? null,
      })),
    [images],
  );

  const toggleSlot = (index: number) => {
    const next = [...images];
    if (next[index]) {
      next.splice(index, 1);
    } else {
      next[index] = "placeholder";
    }
    setValue("images", next.filter(Boolean), { shouldValidate: true });
  };

  return (
    <Card className="bg-primary drop-shadow-md/40 border-none">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-white text-2xl font-bold">
          Imágenes
        </CardTitle>
        <Text className="text-white text-sm">mín. {MIN_PRODUCT_IMAGES}</Text>
      </CardHeader>
      <CardContent className="gap-3">
        <View className="flex-row flex-wrap gap-3">
          {slots.map((slot, i) => (
            <ImageSlot
              key={slot.id}
              uri={slot.uri}
              onPress={() => toggleSlot(i)}
            />
          ))}
        </View>
        <Text className="text-white text-xs">
          Seleccioná hasta {MIN_PRODUCT_IMAGES} imágenes del producto. (
          {images.length}/{MIN_PRODUCT_IMAGES})
        </Text>
        {errors.images && (
          <Text className="text-white text-xs">{errors.images.message}</Text>
        )}
      </CardContent>
    </Card>
  );
}
