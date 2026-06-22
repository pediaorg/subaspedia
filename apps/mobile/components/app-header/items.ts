import type { Href } from "expo-router";
import {
  Bell,
  HelpCircle,
  Home,
  type LucideIcon,
  Shield,
  Star,
} from "lucide-react-native";

export type SidebarItemDef = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: Href;
  // Solo visible con sesión iniciada (datos atados al usuario logueado).
  authOnly?: boolean;
};

export function sidebarItems(): SidebarItemDef[] {
  return [
    { key: "home", label: "Inicio", icon: Home, href: "/" },
    {
      key: "rank",
      label: "Rango",
      icon: Star,
      href: "/rank-up",
      authOnly: true,
    },
    {
      key: "insurances",
      label: "Seguros",
      icon: Shield,
      href: "/insurances" as Href,
      authOnly: true,
    },
    {
      key: "notifications",
      label: "Notificaciones",
      icon: Bell,
      href: "/notifications" as Href,
      authOnly: true,
    },
    { key: "faq", label: "FAQ", icon: HelpCircle, href: "/faq" },
  ];
}
