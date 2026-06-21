import { USER_CATEGORIES } from "@subaspedia/types/user";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { StatCard } from "@/components/profile/stat-card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text as ThemedText } from "@/components/ui/text";
import { api } from "@/lib/api";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function ProfileStats() {
  // "Resumen" (default, a la vista) = métricas agregadas; "Historial" = la lista
  // de pujas. Dos endpoints, una pantalla con tabs.
  const [tab, setTab] = useState("summary");
  const summary = api.user.rankSummary.useQuery();
  const history = api.user.bidHistory.useQuery();
  // Const local: preserva el narrowing dentro de los callbacks (.map/.find).
  const summaryData = summary.data;
  const historyData = history.data;

  return (
    <View className="flex-1 px-4 gap-5">
      <View className="gap-4">
        <Text className="font-bold text-3xl">Estadísticas</Text>
        <Separator className="bg-gray-500" />
      </View>

      <Tabs value={tab} onValueChange={setTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="summary">
            <ThemedText>Resumen</ThemedText>
          </TabsTrigger>
          <TabsTrigger value="history">
            <ThemedText>Historial de pujas</ThemedText>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="flex-1">
          {summary.isLoading && (
            <Text className="text-gray-500">Cargando…</Text>
          )}
          {summary.isError && (
            <Text className="text-center text-destructive">
              No pudimos cargar tus estadísticas. Intentá de nuevo más tarde.
            </Text>
          )}
          {summaryData && (
            <ScrollView contentContainerClassName="gap-5 pb-6">
              <View className="flex-row gap-5">
                <StatCard
                  value={summaryData.activity.participated}
                  label="Subastas participadas"
                />
                <StatCard
                  value={summaryData.activity.won}
                  label="Subastas ganadas"
                />
              </View>
              <View className="flex-row gap-5">
                <StatCard
                  value={currencyFormatter.format(
                    summaryData.activity.totalBid,
                  )}
                  label="Total ofertado"
                />
                <StatCard
                  value={currencyFormatter.format(
                    summaryData.activity.totalPaid,
                  )}
                  label="Total pagado"
                />
              </View>

              <View className="gap-3">
                <Text className="font-bold text-lg">
                  Participación por categoría
                </Text>
                <View className="bg-secondary rounded-2xl p-4 gap-3">
                  {USER_CATEGORIES.map(cat => {
                    const n =
                      summaryData.activity.byCategory.find(
                        c => c.category === cat.value,
                      )?.participated ?? 0;
                    return (
                      <View
                        key={cat.value}
                        className="flex-row justify-between items-center"
                      >
                        <Text className="font-semibold text-gray-700">
                          {cat.label}
                        </Text>
                        <Text className="font-bold">{n}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          )}
        </TabsContent>

        <TabsContent value="history" className="flex-1">
          {history.isLoading && (
            <Text className="text-gray-500">Cargando…</Text>
          )}
          {history.isError && (
            <Text className="text-center text-destructive">
              No pudimos cargar tu historial de pujas. Intentá de nuevo más
              tarde.
            </Text>
          )}
          {historyData?.length === 0 && (
            <Text className="text-gray-500 text-center">
              Todavía no hiciste ninguna puja.
            </Text>
          )}
          {historyData && historyData.length > 0 && (
            <ScrollView contentContainerClassName="gap-3 pb-6">
              {historyData.map(bid => (
                <View
                  key={bid.id}
                  className="bg-secondary rounded-2xl p-4 flex-row justify-between items-center"
                >
                  <View className="flex-1 pr-3">
                    <Text
                      className="font-semibold text-gray-800"
                      numberOfLines={1}
                    >
                      {bid.productName}
                    </Text>
                    {bid.winner && (
                      <Text className="text-xs font-bold text-green-700">
                        Ganadora
                      </Text>
                    )}
                  </View>
                  <Text className="font-bold">
                    {currencyFormatter.format(bid.amount)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </TabsContent>
      </Tabs>
    </View>
  );
}
