import { View } from "react-native";

import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

export function Field({
  label,
  className,
  error,
  children,
}: {
  label: string;
  className?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={`gap-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <Text className="text-destructive text-xs">{error}</Text>}
    </View>
  );
}
