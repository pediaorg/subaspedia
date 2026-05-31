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
        className={`flex-row items-center rounded-full px-4 py-2.5 ${
          active ? "bg-card" : ""
        }`}
      >
        <Icon
          as={icon}
          size={24}
          className={active ? "text-primary" : "text-primary-foreground"}
        />
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
