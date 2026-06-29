import { type Href, Link, type RelativePathString } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { Separator } from "../ui/separator";

type MenuItemProps = {
  icon: LucideIcon;
  label: string;
  href: Href;
};

export function MenuItem({ icon: Icon, label, href }: MenuItemProps) {
  return (
    <View className="w-full">
      <Link href={href} asChild>
        <Pressable className="flex-row items-center gap-2 ml-10 active:opacity-60">
          <Icon size={28} color="#0d4da0" />
          <Text className="font-bold text-2xl text-secondary-foreground">
            {label}
          </Text>
        </Pressable>
      </Link>
      <Separator className="mt-3 bg-gray-500" />
    </View>
  );
}
