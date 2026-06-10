import { useQuery } from "@tanstack/react-query";
import { ScrollView, Text, View } from "react-native";

import type { Penalty } from "@subaspedia/types/penalty";
import PenaltyCard from "@/components/profile/infractions/penalty-card";
import { Separator } from "@/components/ui/separator";

// Mock inline mientras no exista el back (GET /users/me/penalties, sin tabla
// `penalties` todavía). Respeta el tipo Penalty al pie de la letra: cuando
// llegue el endpoint, solo cambia el cuerpo del queryFn por la llamada real.
const MOCK_PENALTIES: Penalty[] = [
  {
    id: 1,
    reason: "Falta de pago — Subasta #12",
    amount: 45000,
    status: "pending",
    issuedAt: "2026-06-05T14:30:00.000Z",
    dueDate: "2026-06-08T14:30:00.000Z",
    auctionId: 12,
  },
  {
    id: 2,
    reason: "Falta de pago — Subasta #7",
    amount: 120000,
    status: "overdue",
    issuedAt: "2026-05-20T10:00:00.000Z",
    dueDate: "2026-05-23T10:00:00.000Z",
    auctionId: 7,
  },
  {
    id: 3,
    reason: "Retracto de oferta — Subasta #3",
    amount: 30000,
    status: "paid",
    issuedAt: "2026-04-10T09:00:00.000Z",
    dueDate: "2026-04-13T09:00:00.000Z",
    auctionId: 3,
  },
];

export default function UserPenalties() {
  const { data: penalties, isLoading } = useQuery({
    queryKey: ["penalties"],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 300));
      return MOCK_PENALTIES;
    },
  });

  return (
    <View className="flex-1 px-4 gap-5">
      <View className="gap-4">
        <Text className="font-bold text-3xl">Multas y pagos</Text>
        <Separator className="bg-gray-500" />
      </View>

      {isLoading && <Text className="text-gray-500">Cargando…</Text>}

      {!isLoading && penalties?.length === 0 && (
        <Text className="text-gray-500 text-center">
          No tenés multas. ¡Seguí así! 🎉
        </Text>
      )}

      <ScrollView contentContainerClassName="gap-6 pb-6">
        {penalties?.map(penalty => (
          <PenaltyCard key={penalty.id} penalty={penalty} />
        ))}
      </ScrollView>
    </View>
  );
}
