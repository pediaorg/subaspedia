import { Text } from "react-native";

import type { OrderStatus } from "@subaspedia/types/transaction";
import { Badge } from "@/components/ui/badge";

type BadgeProps = { status: OrderStatus };

// Mismo molde visual que los badges de productos y multas (w-32 h-5 + sombra de
// texto). Color por etapa del pedido: ámbar=pagado, azul=en camino,
// verde=entregado, gris=retirado.
const BADGE_CONFIG: Record<
  OrderStatus,
  { label: string; containerClass: string; outlineColor: string }
> = {
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
};

export default function OrderStatusBadge({ status }: BadgeProps) {
  const config = BADGE_CONFIG[status];
  return (
    <Badge className={`w-32 h-5 mt-4 ${config.containerClass}`}>
      <Text
        className="text-white font-bold"
        style={{
          textShadowColor: config.outlineColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 1,
        }}
      >
        {config.label}
      </Text>
    </Badge>
  );
}
