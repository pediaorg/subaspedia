import { TriangleAlertIcon } from "lucide-react-native";
import { Alert, Pressable, Text, View } from "react-native";

import type { Penalty, PenaltyStatus } from "@subaspedia/types/penalty";
import { Card } from "@/components/ui/card";

import PenaltyStatusBadge from "./penalty-status-badge";

type PenaltyProps = { penalty: Penalty };

type Action = { label: string };

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

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

// Solo las multas impagas ofrecen acción; una pagada no muestra botón.
function getActionForStatus(penalty: Penalty): Action | null {
  switch (penalty.status) {
    case "pending":
    case "overdue":
      return { label: "Pagar" };
    case "paid":
      return null;
  }
}

function ActionElement({ action }: { action: Action }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      className="active:opacity-60 pr-2"
      onPress={() =>
        // El flujo de pago de multas todavía no existe (va en otra rama).
        Alert.alert("TODO", "Flujo de pago de multa no implementado")
      }
    >
      <Text className="text-xs text-gray-700 underline">{action.label}</Text>
    </Pressable>
  );
}

export default function PenaltyCard({ penalty }: PenaltyProps) {
  const action = getActionForStatus(penalty);

  return (
    <Card className="flex-row items-center border-0 h-24 gap-3 p-2 drop-shadow-2xl/2 z-20">
      <View className="items-center justify-center size-20 rounded-full bg-gray-100">
        <TriangleAlertIcon className={`size-8 ${ICON_COLOR[penalty.status]}`} />
      </View>
      <View className="flex-1 flex-col gap-0.5">
        <Text className="font-bold text-sm text-gray-800" numberOfLines={1}>
          {penalty.reason}
        </Text>
        <PenaltyStatusBadge status={penalty.status} />
        <Text className="text-xs text-gray-600">
          {currencyFormatter.format(penalty.amount)}
          {penalty.status !== "paid" &&
            ` · Vence ${dateFormatter.format(new Date(penalty.dueDate))}`}
        </Text>
      </View>
      {action && <ActionElement action={action} />}
    </Card>
  );
}
