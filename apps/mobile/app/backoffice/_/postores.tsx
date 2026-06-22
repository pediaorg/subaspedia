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

  const rankUps = api.backoffice.pendingRankUps.useQuery();
  const approveRankUp = api.backoffice.approveRankUp.useMutation({
    onSuccess: () => rankUps.refetch(),
  });

  return (
    <View className="gap-6">
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
            <Text className="text-muted-foreground text-sm">
              {person.email}
            </Text>
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

      {/* --- SECCIÓN DE ASCENSOS --- */}
      <View className="gap-3">
        <SectionHeader
          title="Sugerencias de Ascenso"
          hint="Clientes que cumplen los requisitos para subir de rango."
        />
        <QueryState
          isLoading={rankUps.isLoading}
          error={rankUps.error}
          empty={rankUps.data?.length === 0}
          emptyText="No hay sugerencias de ascenso"
        />

        {rankUps.data?.map(sugg => {
          const catLabel =
            PRODUCT_CATEGORIES.find(c => c.value === sugg.suggestedCategory)
              ?.label ?? sugg.suggestedCategory;
          const currLabel =
            PRODUCT_CATEGORIES.find(c => c.value === sugg.currentCategory)
              ?.label ?? sugg.currentCategory;

          return (
            <Card key={sugg.clientId}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold">{sugg.name}</Text>
                  <Text className="text-muted-foreground text-sm">
                    {currLabel} → {catLabel}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    Stats: {sugg.stats.numPms} medios,{" "}
                    {sugg.stats.hasBankAccount ? "1 cuenta" : "0 cuentas"},{" "}
                    {sugg.stats.hasChecks ? "1 cheque" : "0 cheques"},{" "}
                    {sugg.stats.wonAuctions} subastas, ${sugg.stats.bidSumARS}{" "}
                    pujas
                  </Text>
                </View>
                <Button
                  size="sm"
                  disabled={approveRankUp.isPending}
                  onPress={() =>
                    approveRankUp.mutate({
                      clientId: sugg.clientId,
                      category: sugg.suggestedCategory as AuctionCategory,
                    })
                  }
                >
                  <Text>Ascender</Text>
                </Button>
              </View>
            </Card>
          );
        })}
        {approveRankUp.error && (
          <Text className="text-red-500">{approveRankUp.error.message}</Text>
        )}
      </View>
    </View>
  );
}
