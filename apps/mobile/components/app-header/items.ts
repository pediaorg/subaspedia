import type { Href } from "expo-router";
import {
  Bell,
  HelpCircle,
  Home,
  Shield,
  Star,
  type LucideIcon,
} from "lucide-react-native";

export type SidebarItemDef = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: Href;
};

export function sidebarItems(): SidebarItemDef[] {
  return [
    { key: "home", label: "Inicio", icon: Home, href: "/" },
    { key: "rank", label: "Rango", icon: Star, href: "/rank-up" },
    {
      key: "insurances",
      label: "Seguros",
      icon: Shield,
      href: "/insurances" as Href,
    },
    {
      key: "notifications",
      label: "Notificaciones",
      icon: Bell,
      href: "/notifications" as Href,
    },
    { key: "faq", label: "FAQ", icon: HelpCircle, href: "/faq" },
  ];
}
