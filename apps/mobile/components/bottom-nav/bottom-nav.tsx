import { usePathname, useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NAV_ITEMS } from "./items";
import { NavItem } from "./nav-item";

const SHOWN: string[] = [
  "/",
  "/auctions",
  "/new-product",
  "/rank-up",
  "/faq",
  "/profile",
];

function matches(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!SHOWN.some(h => matches(pathname, h))) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ paddingBottom: insets.bottom + 32 }}
      className="absolute inset-x-0 bottom-0 items-center"
    >
      <View className="flex-row items-center gap-1 rounded-full bg-primary px-2 py-2 shadow-lg">
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={matches(pathname, String(item.href))}
            onPress={() => router.push(item.href)}
          />
        ))}
      </View>
    </View>
  );
}
