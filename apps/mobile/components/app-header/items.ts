import type { Href } from "expo-router";
import {
  Bell,
  HelpCircle,
  type LucideIcon,
  Shield,
  Star,
} from "lucide-react-native";

export type SidebarItemDef = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: Href;
};

export function sidebarItems(): SidebarItemDef[] {
  return [
    { key: "rank", label: "Rango", icon: Star, href: "/rank-up" },
    {
      key: "insurances",
      label: "Seguros",
      icon: Shield,
      href: "/insurances" as Href,
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: Bell,
      href: "/notifications",
    },
    { key: "faq", label: "FAQ", icon: HelpCircle, href: "/faq" },
  ];
}
