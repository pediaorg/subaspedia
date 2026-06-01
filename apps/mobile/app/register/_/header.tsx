import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";

export function RegisterHeader() {
  return (
    <View className="px-4 pb-1 pt-3">
      <Pressable
        hitSlop={12}
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/login")
        }
        className="bg-white drop-shadow-md/30 h-10 w-10 items-center justify-center rounded-full"
      >
        <Icon as={ChevronLeft} size={22} className="text-foreground" />
      </Pressable>
    </View>
  );
}
