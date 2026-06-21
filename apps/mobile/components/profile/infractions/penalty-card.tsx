import { TriangleAlertIcon } from "lucide-react-native";
import { Text, View } from "react-native";

import type { Penalty, PenaltyStatus } from "@subaspedia/types/penalty";
import { Card } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";

import PenaltyPaymentDialog from "./penalty-payment-dialog";
import PenaltyStatusBadge from "./penalty-status-badge";

type PenaltyProps = {
  penalty: Penalty;
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Color del ícono por estado (className de nativewind, igual que el menú del
// perfil en profile/index.tsx). Comunica de un vistazo la urgencia de la multa.
const ICON_COLOR: Record<PenaltyStatus, string> = {
  pending: "color-amber-600",
  overdue: "color-red-600",
  paid: "color-gray-400",
};

export default function PenaltyCard({ penalty }: PenaltyProps) {
  // Solo las multas impagas se pueden pagar; una pagada no ofrece acción.
  const canPay = penalty.status !== "paid";

  return (
    <Card className="flex-row items-center border-0 h-24 gap-3 p-2 drop-shadow-xl/2 z-20">
      <View className="items-center justify-center size-20 rounded-full bg-gray-100">
        <TriangleAlertIcon className={`size-8 ${ICON_COLOR[penalty.status]}`} />
      </View>
      <View className="flex-1 flex-col gap-0.5">
        <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>
          {penalty.reason}
        </Text>
        <PenaltyStatusBadge status={penalty.status} />
        <Text className="text-xs text-gray-600">
          {formatMoney(penalty.amount, penalty.currency)}
          {penalty.status !== "paid" &&
            ` · Vence ${dateFormatter.format(new Date(penalty.dueDate))}`}
        </Text>
      </View>
      {canPay && <PenaltyPaymentDialog penalty={penalty} />}
    </Card>
  );
}
