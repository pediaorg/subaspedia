import { CircleStarIcon, Star } from "lucide-react-native";
import { Text } from "react-native";

import { Badge } from "@/components/ui/badge";

type Tier = "comun" | "especial" | "plata" | "oro" | "platino";
type BadgeProps = { tier: Tier };

const TIER_CONFIG: Record<
  Tier,
  { label: string; containerClass: string; textClass: string }
> = {
  comun: {
    label: "COMUN",
    containerClass: "bg-primary",
    textClass: "text-white",
  },
  especial: {
    label: "ESPECIAL",
    containerClass: "bg-[#CD7F32]",
    textClass: "text-[#FFFFFF]",
  },
  plata: {
    label: "PLATA",
    containerClass: "bg-[#e3e4e5]",
    textClass: "text-black",
  },
  oro: { label: "ORO", containerClass: "bg-[#efb810]", textClass: "" },
  platino: { label: "PLATINO", containerClass: "bg-[#93F3B3]", textClass: "" },
};

export default function RankBadge({ tier }: BadgeProps) {
  const config = TIER_CONFIG[tier];
  return (
    <Badge
      className={`self-start relative flex-row justify-between  mt-1.5 h-5 w-24 ${tier === "comun" ? "border-white" : ""} ${config.containerClass}`}
    >
      <Star
        className="absolute  size-4"
        color={tier === "comun" ? "white" : ""}
      />
      <Text className={`font-bold ml-6  text-xs ${config.textClass}`}>
        {config.label}
      </Text>
    </Badge>
  );
}
