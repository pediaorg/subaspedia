import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon";

export function ImageSlot({
  uri,
  onPress,
}: {
  uri: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="border-white bg-muted/40 active:bg-muted aspect-square w-[30%] items-center justify-center rounded-md border border-dashed"
    >
      {uri ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${uri}` }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <Icon as={Plus} size={20} className="text-white" />
      )}
    </Pressable>
  );
}
