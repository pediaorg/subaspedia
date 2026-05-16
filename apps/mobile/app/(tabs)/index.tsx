import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

import { api } from "@/lib/api";
import { authStore } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";

export default function HomeScreen() {
  const { data, isLoading, error } = api.countries.list.useQuery();

  const logout = () => {
    authStore.set(null);
    queryClient.clear();
  };

  return (
    <View className="flex-1 bg-white p-4">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-2xl font-bold">Subaspedia</Text>
        <Pressable
          className="px-3 py-1.5 rounded-md bg-red-500"
          onPress={logout}
        >
          <Text className="text-white font-semibold">Salir</Text>
        </Pressable>
      </View>

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
