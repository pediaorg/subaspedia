import type { LucideIcon } from "lucide-react-native";
import { Pressable } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

type Props = {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
};

export function SidebarItem({ icon, label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 px-5 py-4 active:bg-muted"
    >
      <Icon as={icon} size={22} className="text-foreground" />
      <Text className="text-base font-medium">{label}</Text>
    </Pressable>
  );
}
