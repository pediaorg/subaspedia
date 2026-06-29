import { Text, View } from "react-native";

import type { PenaltyStatus } from "@subaspedia/types/penalty";

type BadgeProps = { status: PenaltyStatus };

const BADGE_CONFIG: Record<
  PenaltyStatus,
  { label: string; containerClass: string; outlineColor: string }
> = {
  pending: {
    label: "Pendiente",
    containerClass: "bg-[#D8B582]",
    outlineColor: "#7A5E35",
  },
  overdue: {
    label: "Vencida",
    containerClass: "bg-[#D88F82]",
    outlineColor: "#7A4239",
  },
  paid: {
    label: "Pagada",
    containerClass: "bg-[#93D882]",
    outlineColor: "#3D7A35",
  },
};

export default function PenaltyStatusBadge({ status }: BadgeProps) {
  const config = BADGE_CONFIG[status];
  return (
    <View
      className={`self-start mt-1 px-3 py-1 rounded-full ${config.containerClass}`}
    >
      <Text
        numberOfLines={1}
        className="text-white font-bold text-xs"
        style={{
          textShadowColor: config.outlineColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 1,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
