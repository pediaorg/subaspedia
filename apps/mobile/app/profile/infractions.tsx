import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PenaltyCard from "@/components/profile/infractions/penalty-card";
import TransactionCard from "@/components/profile/transactions/transaction-card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

export default function UserPenalties() {
  const [tab, setTab] = useState("penalties");
  const insets = useSafeAreaInsets();

  const {
    data: penalties,
    isLoading: loadingPenalties,
    error: errorPenalties,
  } = api.user.penalties.useQuery();

  const {
    data: transactions,
    isLoading: loadingTransactions,
    error: errorTransactions,
  } = api.user.transactions.useQuery();

  return (
    <View className="flex-1 px-4 gap-5">
      <View className="gap-4">
        <Text className="font-bold text-3xl">Multas y pagos</Text>
        <Separator className="bg-gray-500" />
      </View>

      <Tabs value={tab} onValueChange={setTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="penalties">
            <Text>Multas</Text>
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Text>Pagos</Text>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="penalties" className="flex-1">
          {loadingPenalties && <Text className="text-gray-500">Cargando…</Text>}

          {errorPenalties && (
            <Text className="text-red-500 py-4">
              No pudimos cargar tus multas: {errorPenalties.message}
            </Text>
          )}

          {!loadingPenalties && !errorPenalties && penalties?.length === 0 && (
            <Text className="text-gray-500 text-center">
              No tenés multas. ¡Seguí así!
            </Text>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-6 pt-4"
            contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
          >
            {penalties?.map(penalty => (
              <PenaltyCard key={penalty.id} penalty={penalty} />
            ))}
          </ScrollView>
        </TabsContent>

        <TabsContent value="transactions" className="flex-1">
          {loadingTransactions && (
            <Text className="text-gray-500">Cargando…</Text>
          )}

          {errorTransactions && (
            <Text className="text-red-500 py-4">
              No pudimos cargar tus pagos: {errorTransactions.message}
            </Text>
          )}

          {!loadingTransactions &&
            !errorTransactions &&
            transactions?.length === 0 && (
              <Text className="text-gray-500 text-center">
                Todavía no compraste nada en una subasta.
              </Text>
            )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-6 pt-4"
            contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
          >
            {transactions?.map(transaction => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </ScrollView>
        </TabsContent>
      </Tabs>
    </View>
  );
}
