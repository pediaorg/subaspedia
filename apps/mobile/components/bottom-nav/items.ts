import type { Href } from "expo-router";
import {
  Gavel,
  Home,
  KeyRound,
  type LucideIcon,
  Plus,
  User,
} from "lucide-react-native";

export type NavItemDef = {
  key: string;
  label: string;
  icon: LucideIcon;
  href: Href;
};

export function navItems(isAuthed: boolean): NavItemDef[] {
  return [
    { key: "home", label: "Home", icon: Home, href: "/" },
    { key: "create", label: "Create", icon: Plus, href: "/new-product" },
    { key: "search", label: "Search", icon: Gavel, href: "/auctions" },
    isAuthed
      ? {
          key: "profile",
          label: "Profile",
          icon: User,
          href: "/profile" as Href,
        }
      : { key: "login", label: "Profile", icon: KeyRound, href: "/login" },
  ];
}
