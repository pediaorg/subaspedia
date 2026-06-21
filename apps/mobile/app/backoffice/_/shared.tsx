import { ActivityIndicator, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

// Helpers de UI compartidos por las secciones del backoffice.

export function SectionHeader({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <View className="gap-1">
      <Text variant="h3" className="font-semibold">
        {title}
      </Text>
      {hint && <Text className="text-muted-foreground text-sm">{hint}</Text>}
    </View>
  );
}

export function QueryState({
  isLoading,
  error,
  empty,
  emptyText,
}: {
  isLoading: boolean;
  error: { message: string } | null;
  empty: boolean;
  emptyText: string;
}) {
  if (isLoading) return <ActivityIndicator />;
  if (error)
    return <Text className="text-red-500">Error: {error.message}</Text>;
  if (empty) return <Text className="text-gray-400">{emptyText}</Text>;
  return null;
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="border-border gap-2 rounded-xl border p-3">
      {children}
    </View>
  );
}

// Fila seleccionable con check, usada en el armado de catálogos y subastas.
export function SelectableRow({
  selected,
  onPress,
  title,
  subtitle,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <Button
      variant="outline"
      onPress={onPress}
      className={`h-auto flex-row items-center justify-between gap-2 rounded-xl border p-3 ${
        selected ? "border-primary bg-primary/5" : "border-border"
      }`}
    >
      <View className="flex-1 items-start">
        <Text className="font-semibold">{title}</Text>
        {subtitle && (
          <Text className="text-muted-foreground text-sm">{subtitle}</Text>
        )}
      </View>
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border ${
          selected ? "border-primary bg-primary" : "border-border"
        }`}
      >
        {selected && <Text className="text-xs text-white">✓</Text>}
      </View>
    </Button>
  );
}
