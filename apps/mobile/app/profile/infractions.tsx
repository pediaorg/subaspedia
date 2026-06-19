import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import type { Penalty } from "@subaspedia/types/penalty";
import type { Transaction } from "@subaspedia/types/transaction";
import PenaltyCard from "@/components/profile/infractions/penalty-card";
import TransactionCard from "@/components/profile/transactions/transaction-card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock inline mientras no exista el back (GET /users/me/penalties, sin tabla
// `penalties` todavía). Respeta el tipo Penalty al pie de la letra: cuando
// llegue el endpoint, solo cambia el cuerpo del queryFn por la llamada real.
const MOCK_PENALTIES: Penalty[] = [
  {
    id: 1,
    reason: "Falta de pago — Subasta #12",
    amount: 45000,
    currency: "ARS",
    status: "pending",
    issuedAt: "2026-06-05T14:30:00.000Z",
    dueDate: "2026-06-08T14:30:00.000Z",
    auctionId: 12,
  },
  {
    id: 2,
    reason: "Falta de pago — Subasta #7",
    amount: 1200,
    currency: "USD",
    status: "overdue",
    issuedAt: "2026-05-20T10:00:00.000Z",
    dueDate: "2026-05-23T10:00:00.000Z",
    auctionId: 7,
  },
  {
    id: 3,
    reason: "Falta de pago — Subasta #3",
    amount: 30000,
    currency: "ARS",
    status: "paid",
    issuedAt: "2026-04-10T09:00:00.000Z",
    dueDate: "2026-04-13T09:00:00.000Z",
    auctionId: 3,
  },
];

// Mock inline del historial de compras (GET /users/me/transactions; la `img`
// la resolverá el back igual que en products). Solo compras: los pagos de multa
// viven en la pestaña Multas.
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 1,
    productName: "Reloj de bolsillo art déco",
    img: "https://picsum.photos/seed/tx-1/200",
    amount: 82000,
    currency: "ARS",
    date: "2026-06-12T16:00:00.000Z",
    auctionId: 12,
    status: "delivered",
  },
  {
    id: 2,
    productName: "Óleo sobre lienzo — anónimo",
    img: "https://picsum.photos/seed/tx-2/200",
    amount: 3500,
    currency: "USD",
    date: "2026-06-02T11:30:00.000Z",
    auctionId: 9,
    status: "shipped",
  },
  {
    id: 3,
    productName: "Juego de té de porcelana (18 piezas)",
    img: "https://picsum.photos/seed/tx-3/200",
    amount: 54000,
    currency: "ARS",
    date: "2026-05-18T09:15:00.000Z",
    auctionId: 5,
    status: "picked_up",
  },
];

export default function UserPenalties() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("penalties");

  const {
    data: penalties,
    isLoading: loadingPenalties,
    error: errorPenalties,
  } = useQuery({
    queryKey: ["penalties"],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 300));
      return MOCK_PENALTIES;
    },
  });

  const {
    data: transactions,
    isLoading: loadingTransactions,
    error: errorTransactions,
  } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 300));
      return MOCK_TRANSACTIONS;
    },
  });

  // Mock: marca la multa como pagada en la cache. Se usa setQueryData (no
  // invalidateQueries) porque el queryFn devuelve el mock fijo -> un refetch la
  // "revertiría" a pending. Con el back real esto pasa a una mutation +
  // invalidate (PUT /penalties/{id}/status).
  function handlePaid(penaltyId: number) {
    queryClient.setQueryData<Penalty[]>(["penalties"], prev =>
      prev?.map(p => (p.id === penaltyId ? { ...p, status: "paid" } : p)),
    );
  }

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
              No tenés multas. ¡Seguí así! 🎉
            </Text>
          )}

          <ScrollView contentContainerClassName="gap-6 py-4">
            {penalties?.map(penalty => (
              <PenaltyCard
                key={penalty.id}
                penalty={penalty}
                onPaid={handlePaid}
              />
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

          <ScrollView contentContainerClassName="gap-6 py-4">
            {transactions?.map(transaction => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </ScrollView>
        </TabsContent>
      </Tabs>
    </View>
  );
}
