import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import { Platform, Pressable, Text, View } from "react-native";

import { Icon } from "@/components/ui/icon";

type Props = {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
};

export function NavItem({ icon, label, active, onPress }: Props) {
  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <View
        style={{
          borderRadius: 999,
          overflow: "hidden",
          backgroundColor: active ? "#ffffff" : "transparent",
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}
      >
        <Icon as={icon} size={24} color={active ? "#1f7ad9" : "#ffffff"} />
        {active && (
          <Text
            numberOfLines={1}
            className="ml-2 text-[15px] font-semibold text-primary"
          >
            {label}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
