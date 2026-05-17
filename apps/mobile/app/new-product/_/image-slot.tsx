import { Plus } from "lucide-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

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
        <Text className="text-muted-foreground text-xs">Imagen</Text>
      ) : (
        <Icon as={Plus} size={20} className="text-white" />
      )}
    </Pressable>
  );
}
