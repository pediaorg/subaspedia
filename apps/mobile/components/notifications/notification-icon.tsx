import {
  BadgeCheck,
  Gavel,
  Handshake,
  TriangleAlert,
  Wallet,
} from "lucide-react-native";
import { View } from "react-native";

import type { NotificationRoute } from "@subaspedia/types/notification";
import { cn } from "@/lib/utils";

// Mapeo route -> ícono y color del avatar circular. Centralizado para que la
// lista y el detalle compartan el mismo lenguaje visual.
const STYLE: Record<
  NotificationRoute,
  {
    Icon: typeof BadgeCheck;
    iconClass: string;
    bgClass: string;
  }
> = {
  sanction: {
    Icon: TriangleAlert,
    iconClass: "text-red-600",
    bgClass: "bg-red-100",
  },
  paymentMethod: {
    Icon: Wallet,
    // Marrón ≈ amber-800 sobre amber-100.
    iconClass: "text-amber-800",
    bgClass: "bg-amber-100",
  },
  winProduct: {
    Icon: BadgeCheck,
    iconClass: "text-green-600",
    bgClass: "bg-green-100",
  },
  proposal: {
    Icon: Handshake,
    iconClass: "text-gray-600",
    bgClass: "bg-gray-200",
  },
  auction: {
    Icon: Gavel,
    iconClass: "text-primary",
    bgClass: "bg-primary/15",
  },
};

const SIZE_CLASS = {
  sm: "size-10",
  lg: "size-14",
};

export function NotificationIcon({
  route,
  size = "sm",
  className,
}: {
  route: NotificationRoute;
  size?: "sm" | "lg";
  className?: string;
}) {
  const { Icon, iconClass, bgClass } = STYLE[route];
  return (
    <View
      className={cn(
        "items-center justify-center rounded-full",
        SIZE_CLASS[size],
        bgClass,
        className,
      )}
    >
      <Icon size={size === "lg" ? 28 : 20} className={iconClass} />
    </View>
  );
}
