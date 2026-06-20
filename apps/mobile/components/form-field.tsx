import { View } from "react-native";

import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";

export function FormField({
  label,
  className,
  labelClassName,
  error,
  children,
}: {
  label?: string;
  className?: string;
  labelClassName?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View className={`gap-1.5 ${className ?? ""}`}>
      {label ? <Label className={labelClassName}>{label}</Label> : null}
      {children}
      {error ? <Text className="text-destructive text-xs">{error}</Text> : null}
    </View>
  );
}
