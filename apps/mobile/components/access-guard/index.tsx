import { usePathname } from "expo-router";

import { useAuth } from "@/lib/auth";

import { RequireAuth } from "./require-auth";
import { RequirePaymentMethod } from "./require-payment-method";
import { RequireRank } from "./require-rank";
import { RequireSession } from "./require-session";

type AccessLevel = "auth" | "rank" | "payment";

// Rutas protegidas y el nivel mínimo que exige cada una. El resto de las
// rutas (login, catálogo público) quedan abiertas. Los niveles son
// jerárquicos: "rank" implica "auth" y "payment" implica ambos.
const PROTECTED_ROUTES: { pattern: RegExp; level: AccessLevel }[] = [
  { pattern: /^\/profile(\/|$)/, level: "auth" },
  { pattern: /^\/new-product(\/|$)/, level: "auth" },
  { pattern: /^\/auctions\/[^/]+/, level: "auth" },
  { pattern: /^\/rank-up(\/|$)/, level: "rank" },
];

export function AccessGuard() {
  const pathname = usePathname();
  const auth = useAuth();

  const rule = PROTECTED_ROUTES.find(r => r.pattern.test(pathname));
  if (!rule) return null;

  if (auth.loading) return <RequireSession />;
  if (!auth.isAuthed) return <RequireAuth />;
  if (rule.level === "auth") return null;

  if (!auth.category) return <RequireRank />;
  if (rule.level === "rank") return null;

  if (!auth.hasVerifiedPaymentMethod) return <RequirePaymentMethod />;

  return null;
}
