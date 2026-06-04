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
    <View className="relative justify-center">
      <Input
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        className={cn(
          "bg-secondary h-12 rounded-2xl border-0 pr-11 text-base",
          className,
        )}
      />
      <View className="absolute right-4">
        <Icon as={Search} size={20} className="text-muted-foreground" />
      </View>
    </View>
  );
}
