import { useAuth } from "@/lib/auth";

import { RequireAuth } from "./require-auth";
import { RequirePaymentMethod } from "./require-payment-method";
import { RequireRank } from "./require-rank";
import { RequireSession } from "./require-session";
import { useMe } from "./use-me";

export function AccessGuard() {
  const auth = useAuth();
  const me = useMe();

  if (auth.loading || (auth.isAuthed && me.loading)) return <RequireSession />;
  if (!auth.isAuthed) return <RequireAuth />;
  if (!me.category) return <RequireRank />;
  if (!me.hasVerifiedPaymentMethod) return <RequirePaymentMethod />;

  return null;
}
