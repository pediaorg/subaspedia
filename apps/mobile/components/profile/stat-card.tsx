import { Text, View } from "react-native";

type StatCardProps = {
  value: string | number;
  label: string;
};

export function StatCard({ value, label }: StatCardProps) {
  return (
    <View className="flex-1 bg-secondary w-max items-center justify-center border-0 rounded-2xl h-20">
      <Text className="font-bold">{value}</Text>
      <Text className="text-center font-semibold">{label}</Text>
    </View>
  );
}
