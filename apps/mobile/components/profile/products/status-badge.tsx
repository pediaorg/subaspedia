import { Text } from "react-native";

import { Badge } from "@/components/ui/badge";
export type Status =
  | "revision"
  | "tasado"
  | "rechazado"
  | "aprobado"
  | "subastado";
type BadgeProps = { status: Status };

const BADGE_CONFIG: Record<
  Status,
  { label: string; containerClass: string; outlineColor: string }
> = {
  revision: {
    label: "Revisión",
    containerClass: "bg-[#D8D182]",
    outlineColor: "#7A7335",
  },
  tasado: {
    label: "Tasado",
    containerClass: "bg-[#A182D8]",
    outlineColor: "#4B3D75",
  },
  rechazado: {
    label: "Rechazado",
    containerClass: "bg-[#D88F82]",
    outlineColor: "#7A4239",
  },
  aprobado: {
    label: "Aprobado",
    containerClass: "bg-[#93D882]",
    outlineColor: "#3D7A35",
  },
  subastado: {
    label: "Subastado",
    containerClass: "bg-[#6E7EF6]",
    outlineColor: "#2B3A99",
  },
};

export default function StatusBadge({ status }: BadgeProps) {
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
