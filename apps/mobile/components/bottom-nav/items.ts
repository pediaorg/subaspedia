import type { Href } from "expo-router";
import { Gavel, Home, type LucideIcon, Plus, User } from "lucide-react-native";

export type NavItemDef = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: Href;
};

export const NAV_ITEMS: NavItemDef[] = [
  { key: "home", label: "Home", icon: Home, href: "/" },
  { key: "create", label: "Create", icon: Plus, href: "/new-product" },
  { key: "search", label: "Search", icon: Gavel, href: "/auctions" },
  { key: "profile", label: "Profile", icon: User, href: "/profile" },
] as const;
