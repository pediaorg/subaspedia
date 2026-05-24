import { Star } from "lucide-react-native";
import { Text } from "react-native";

import type { UserCategory } from "@subaspedia/types/user";
import { Badge } from "@/components/ui/badge";

type BadgeProps = { category: UserCategory };

const TIER_CONFIG: Record<
  UserCategory,
  { label: string; containerClass: string; textClass: string }
> = {
  common: {
    label: "COMUN",
    containerClass: "bg-primary",
    textClass: "text-white",
  },
  special: {
    label: "ESPECIAL",
    containerClass: "bg-[#CD7F32]",
    textClass: "text-[#FFFFFF]",
  },
  silver: {
    label: "PLATA",
    containerClass: "bg-[#e3e4e5]",
    textClass: "text-black",
  },
  gold: { label: "ORO", containerClass: "bg-[#efb810]", textClass: "" },
  platinum: { label: "PLATINO", containerClass: "bg-[#93F3B3]", textClass: "" },
};

export default function RankBadge({ category }: BadgeProps) {
  const config = TIER_CONFIG[category];
  return (
    <Badge
      className={`self-start relative flex-row justify-between  mt-1.5 h-5 w-24 ${category === "common" ? "border-white" : ""} ${config.containerClass}`}
    >
      <Star
        className="absolute  size-4"
        color={category === "common" ? "white" : undefined}
      />
      <Text className={`font-bold ml-6 uppercase text-xs ${config.textClass}`}>
        {config.label}
      </Text>
    </Badge>
  );
}
