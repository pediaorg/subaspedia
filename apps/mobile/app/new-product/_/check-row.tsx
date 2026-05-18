import { Pressable, View } from "react-native";

import { Checkbox } from "@/components/ui/checkbox";
import { Text } from "@/components/ui/text";

export function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      className="flex-row items-start gap-3"
    >
      <View className="pt-0.5">
        <Checkbox
          checked={checked}
          onCheckedChange={onChange}
          className="border-white"
          checkedClassName="border-white"
          indicatorClassName="bg-white"
          iconClassName="text-black"
        />
      </View>
      <Text className="flex-1 text-white text-sm">{children}</Text>
    </Pressable>
  );
}
