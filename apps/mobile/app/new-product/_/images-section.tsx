import * as ImagePicker from "expo-image-picker";
import * as React from "react";
import { type Control, useController } from "react-hook-form";
import { View } from "react-native";

import {
  MIN_PRODUCT_IMAGES,
  type NewProductFormInput,
} from "@subaspedia/types/forms/new-product";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

import { ImageSlot } from "./image-slot";

export function ImagesSection({
  control,
}: {
  control: Control<NewProductFormInput>;
}) {
  const { field, fieldState } = useController({ control, name: "images" });
  const images = field.value ?? [];

  const slots = React.useMemo(
    () =>
      Array.from({ length: MIN_PRODUCT_IMAGES }, (_, i) => ({
        id: `slot-${i}`,
        uri: images[i] ?? null,
      })),
    [images],
  );

  const assetToBase64 = async (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.base64) return asset.base64;
    const res = await fetch(asset.uri);
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return dataUrl.split(",")[1];
  };

  const pickImage = async (index: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.5,
        base64: true,
      });
      if (result.canceled) return;

      const base64 = await assetToBase64(result.assets[0]);
      if (!base64) return;

      const next = [...images];
      next[index] = base64;
      field.onChange(next.filter(Boolean));
    } catch (e) {
      console.error("PICK ERROR", e);
    }
  };

  const handleSlot = (index: number) => {
    if (images[index]) {
      const next = [...images];
      next.splice(index, 1);
      field.onChange(next.filter(Boolean));
    } else {
      pickImage(index);
    }
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
              onPress={() => handleSlot(i)}
            />
          ))}
        </View>
        <Text className="text-white text-xs">
          Seleccioná hasta {MIN_PRODUCT_IMAGES} imágenes del producto. (
          {images.length}/{MIN_PRODUCT_IMAGES})
        </Text>
        {fieldState.error && (
          <Text className="text-white text-xs">{fieldState.error.message}</Text>
        )}
      </CardContent>
    </Card>
  );
}
