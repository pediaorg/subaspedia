import { Text } from "react-native";

import type { ProductStatus } from "@subaspedia/types/product";
import { Badge } from "@/components/ui/badge";

type BadgeProps = { status: ProductStatus };

const BADGE_CONFIG: Record<
  ProductStatus,
  { label: string; containerClass: string; outlineColor: string }
> = {
  under_review: {
    label: "En revisión",
    containerClass: "bg-[#D8D182]",
    outlineColor: "#7A7335",
  },
  appraised: {
    label: "Tasado",
    containerClass: "bg-[#A182D8]",
    outlineColor: "#4B3D75",
  },
  rejected: {
    label: "Rechazado",
    containerClass: "bg-[#D88F82]",
    outlineColor: "#7A4239",
  },
  approved: {
    label: "Aprobado",
    containerClass: "bg-[#93D882]",
    outlineColor: "#3D7A35",
  },
  auctioned: {
    label: "Subastado",
    containerClass: "bg-[#6E7EF6]",
    outlineColor: "#2B3A99",
  },
};

export default function StatusBadge({ status }: BadgeProps) {
  const config = BADGE_CONFIG[status];
  return (
    <Badge className={`self-start mt-2 px-3 py-1 ${config.containerClass}`}>
      <Text
        className="text-white font-bold text-xs"
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
