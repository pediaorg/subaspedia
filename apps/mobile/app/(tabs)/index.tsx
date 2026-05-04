import { ActivityIndicator, FlatList, Text, View } from "react-native";

import { api } from "@/lib/api";

export default function HomeScreen() {
  const { data, isLoading, error } = api.countries.list.useQuery();

  return (
    <View className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">Subaspedia</Text>

      {isLoading && <ActivityIndicator />}
      {error && <Text className="text-red-500">Error: {error.message}</Text>}

      <FlatList
        data={data}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <View className="py-3 border-b border-gray-200">
            <Text className="text-lg font-semibold">{item.name}</Text>
            <Text className="text-sm text-gray-500">
              {item.capital} — {item.nationality}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text className="text-gray-400">No hay países cargados</Text>
          ) : null
        }
      />
    </View>
  );
}
