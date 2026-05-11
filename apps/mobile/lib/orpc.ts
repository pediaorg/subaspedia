import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { AppClient } from "@/api/rpc";
import { authStore } from "@/lib/auth";

const link = new RPCLink({
  url: `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787"}/rpc`,
  headers: () => {
    const token = authStore.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  fetch: (req, init) => fetch(req, { ...init, credentials: "include" }),
});

const client = createORPCClient<AppClient>(link);

export const orpc = createTanstackQueryUtils(client);
