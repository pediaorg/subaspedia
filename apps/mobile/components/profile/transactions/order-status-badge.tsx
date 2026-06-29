import { Text, View } from "react-native";

import type { OrderStatus } from "@subaspedia/types/transaction";

type BadgeProps = { status: OrderStatus };

// Mismo molde visual que los badges de productos y multas (w-32 h-5 + sombra de
// texto). Color por etapa: naranja=a pagar, azul=pendiente/en camino,
// ámbar=pagado, verde=entregado, gris=retirado, rojo=rechazado.
const BADGE_CONFIG: Record<
  OrderStatus,
  { label: string; containerClass: string; outlineColor: string }
> = {
  unpaid: {
    label: "A pagar",
    containerClass: "bg-[#E0A458]",
    outlineColor: "#8A5E1F",
  },
  pending: {
    label: "Pendiente",
    containerClass: "bg-[#82AED8]",
    outlineColor: "#35597A",
  },
  paid: {
    label: "Pagado",
    containerClass: "bg-[#D8B582]",
    outlineColor: "#7A5E35",
  },
  shipped: {
    label: "En camino",
    containerClass: "bg-[#82AED8]",
    outlineColor: "#35597A",
  },
  delivered: {
    label: "Entregado",
    containerClass: "bg-[#93D882]",
    outlineColor: "#3D7A35",
  },
  picked_up: {
    label: "Retirado",
    containerClass: "bg-[#C3C9CE]",
    outlineColor: "#5A6168",
  },
  rejected: {
    label: "Rechazado",
    containerClass: "bg-[#D88282]",
    outlineColor: "#7A3535",
  },
};

export default function OrderStatusBadge({ status }: BadgeProps) {
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
