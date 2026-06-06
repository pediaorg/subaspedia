import { Check, Paperclip } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export function DniField({
  label,
  loaded,
  onPress,
}: {
  label: string;
  loaded: boolean;
  onPress: () => void;
}) {
  return (
    <View className="flex-1 gap-1">
      <Text className="text-muted-foreground text-xs">{label}</Text>
      <Pressable
        onPress={onPress}
        className="bg-secondary h-10 flex-row items-center justify-between rounded-md px-3"
      >
        <Text
          className={
            loaded ? "text-foreground text-sm" : "text-muted-foreground text-sm"
          }
        >
          {loaded ? "Adjuntada" : "Adjuntar"}
        </Text>
        <Icon
          as={loaded ? Check : Paperclip}
          size={18}
          className={loaded ? "text-primary" : "text-muted-foreground"}
        />
      </Pressable>
    </View>
  );
}
