import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { Platform } from "react-native";

import type { AppClient } from "@/api/rpc";
import { authStore } from "@/lib/auth";

const isWeb = Platform.OS === "web";

const link = new RPCLink({
  url: `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787"}/rpc`,
  headers: () => {
    const h: Record<string, string> = {};
    if (!isWeb) h["X-Client"] = "native";
    const access = authStore.getAccessToken();
    if (access) h.Authorization = `Bearer ${access}`;
    const refresh = authStore.getRefreshToken();
    if (refresh) h["X-Refresh-Token"] = refresh;
    return h;
  },
  fetch: (req, init) => fetch(req, { ...init, credentials: "include" }),
});

const client = createORPCClient<AppClient>(link);

export const orpc = createTanstackQueryUtils(client);
