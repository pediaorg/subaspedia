import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { useState } from "react";
import { type LayoutChangeEvent, Pressable } from "react-native";

export function ImageSlot({
  uri,
  onPress,
}: {
  uri: string | null;
  onPress: () => void;
}) {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && w !== width) setWidth(w);
  };

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={{ width: "31%", height: width || undefined }}
      className="bg-white/15 active:bg-white/25 overflow-hidden items-center justify-center rounded-md border-2 border-dashed border-white/70"
    >
      {uri ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${uri}` }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <Plus size={28} color="#ffffff" />
      )}
    </Pressable>
  );
}
