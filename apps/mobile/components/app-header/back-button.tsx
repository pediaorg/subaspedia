import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon";

type Props = {
  onPress?: () => void;
};

export function BackButton({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      accessibilityLabel="Volver atrás"
      hitSlop={8}
      className="size-10 items-center justify-center rounded-full bg-white"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      <Icon as={ArrowLeft} size={24} className="text-foreground" />
    </Pressable>
  );
}
