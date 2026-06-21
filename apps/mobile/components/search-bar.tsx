import { Search } from "lucide-react-native";
import { View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Buscar...",
  className,
}: SearchBarProps) {
  return (
    <View className={cn("relative justify-center", className)}>
      <Input
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        className="bg-secondary h-12 rounded-2xl border-0 pr-11 text-base"
      />
      <View className="absolute right-4 top-0 bottom-0 justify-center">
        <Icon as={Search} size={20} className="text-muted-foreground" />
      </View>
    </View>
  );
}
