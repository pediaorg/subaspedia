import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { Platform } from "react-native";

import type { AppClient } from "@/api/rpc";
import { authStore } from "@/lib/auth";
import { accessTokenExpired, refreshAccessToken } from "@/lib/auth-refresh";

const isWeb = Platform.OS === "web";

// Devuelve una copia del request con el Authorization actualizado al nuevo token.
function withAuth(req: Request, token: string): Request {
  const headers = new Headers(req.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return new Request(req, { headers });
}

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
  fetch: async (req, init) => {
    let request = req as Request;
    const authed = !!authStore.getAccessToken();

    // Proactivo: si la "clave de auth" (access token) ya venció (su TTL llegó a
    // ~0), la refrescamos antes de mandar y reemplazamos el header.
    if (authed && accessTokenExpired()) {
      try {
        request = withAuth(request, await refreshAccessToken());
      } catch {
        // No se pudo refrescar (sesión vencida => logout ya ejecutado).
        // Mandamos igual; el server responderá 401 y la query fallará.
      }
    }

    // El body se consume en el primer fetch: guardamos un clon por si hay que
    // reintentar.
    const retryRequest = request.clone();
    let res = await fetch(request, { ...init, credentials: "include" });

    // Reactivo: el server rechazó por access inválido/vencido. Intentamos un
    // único refresh + reintento de la request actual.
    if (res.status === 401 && authed) {
      try {
        const token = await refreshAccessToken();
        res = await fetch(withAuth(retryRequest, token), {
          ...init,
          credentials: "include",
        });
      } catch {
        // Refresh falló => sesión terminada (logout ya ejecutado). Devolvemos
        // el 401 original.
      }
    }

    return res;
  },
});

const client = createORPCClient<AppClient>(link);

export const orpc = createTanstackQueryUtils(client);
