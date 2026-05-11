import { type Href, Link, type RelativePathString } from "expo-router";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { Separator } from "../ui/separator";

type MenuItemProps = {
  icon: LucideIcon;
  label: string;
  link: Href;
};

export function MenuItem({ icon: Icon, label, link }: MenuItemProps) {
  return (
    <View className="w-full">
      <Link href={link} asChild>
        <Pressable className="flex-row gap-2 ml-10">
          <Icon className="color-blue-900 size-8" />
          <Text className="font-bold text-2xl text-blue-900">{label}</Text>
        </Pressable>
      </Link>
      <Separator className="mt-3 bg-gray-500" />
    </View>
  );
}
