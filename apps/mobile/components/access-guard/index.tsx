import { useAuth } from "@/lib/auth";

import { RequireAuth } from "./require-auth";
import { RequirePaymentMethod } from "./require-payment-method";
import { RequireRank } from "./require-rank";
import { RequireSession } from "./require-session";

export function AccessGuard() {
  const auth = useAuth();

  if (auth.loading) return <RequireSession />;
  if (!auth.isAuthed) return <RequireAuth />;
  if (!auth.category) return <RequireRank />;
  if (!auth.hasVerifiedPaymentMethod) return <RequirePaymentMethod />;

  return null;
}
