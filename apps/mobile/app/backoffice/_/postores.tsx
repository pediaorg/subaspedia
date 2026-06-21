import { View } from "react-native";

import { type AuctionCategory, PRODUCT_CATEGORIES } from "@subaspedia/types";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { api } from "@/lib/api";

import { Card, QueryState, SectionHeader } from "./shared";

// Paso 2 del flujo: asignar categoría tras la investigación del postor.
export function PostoresSection() {
  const pending = api.backoffice.pendingClients.useQuery();
  const assign = api.backoffice.assignCategory.useMutation({
    onSuccess: () => pending.refetch(),
  });

  return (
    <View className="gap-3">
      <SectionHeader
        title="Postores a investigar"
        hint="Asigná una categoría para admitir al postor."
      />
      <QueryState
        isLoading={pending.isLoading}
        error={pending.error}
        empty={pending.data?.length === 0}
        emptyText="No hay postores pendientes"
      />

      {pending.data?.map(person => (
        <Card key={person.id}>
          <Text className="font-semibold">{person.name ?? "Sin nombre"}</Text>
          <Text className="text-muted-foreground text-sm">{person.email}</Text>
          <View className="mt-1 flex-row flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map(cat => (
              <Button
                key={cat.value}
                size="sm"
                variant="outline"
                disabled={assign.isPending}
                onPress={() =>
                  assign.mutate({
                    personId: person.id,
                    category: cat.value as AuctionCategory,
                  })
                }
                className="rounded-full"
              >
                <Text className="text-sm font-medium">{cat.label}</Text>
              </Button>
            ))}
          </View>
        </Card>
      ))}
      {assign.error && (
        <Text className="text-red-500">{assign.error.message}</Text>
      )}
    </View>
  );
}
