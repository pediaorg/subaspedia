import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { Platform } from "react-native";

import type { AppClient } from "@/api/rpc";
import { authStore } from "@/lib/auth";

const isWeb = Platform.OS === "web";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8787";

// Cliente mínimo SOLO para refrescar el access token. Usa un link plano (sin el
// interceptor de 401) para que un fallo del refresh no se reintente a sí mismo
// en loop. El refresh token viaja por cookie httpOnly (web) o header (native).
const refreshLink = new RPCLink({
  url: `${API_URL}/rpc`,
  headers: () => {
    const h: Record<string, string> = {};
    if (!isWeb) h["X-Client"] = "native";
    const refresh = authStore.getRefreshToken();
    if (!isWeb && refresh) h["X-Refresh-Token"] = refresh;
    return h;
  },
  fetch: (req, init) => fetch(req, { ...init, credentials: "include" }),
});
const refreshClient = createORPCClient<AppClient>(refreshLink);

// Refresco compartido: si varias requests dan 401 a la vez, se refresca una sola
// vez y todas esperan el mismo resultado.
let refreshing: Promise<boolean> | null = null;

function refreshAccessToken(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await (
          refreshClient as {
            auth: { refresh: () => Promise<{ accessToken?: string }> };
          }
        ).auth.refresh();
        if (res?.accessToken) {
          authStore.set({
            accessToken: res.accessToken,
            // En web el refresh sigue en la cookie; en native lo mantenemos.
            refreshToken: authStore.getRefreshToken() ?? undefined,
          });
          return true;
        }
      } catch {
        // cae al cierre de sesión de abajo
      }
      // El refresh falló (sin sesión o refresh vencido): cerramos sesión. El
      // AccessGuard reacciona al store y redirige a /login en vez de dejar la
      // pantalla cargando para siempre.
      authStore.set(null);
      return false;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

const link = new RPCLink({
  url: `${API_URL}/rpc`,
  headers: () => {
    const h: Record<string, string> = {};
    if (!isWeb) h["X-Client"] = "native";
    const access = authStore.getAccessToken();
    if (access) h.Authorization = `Bearer ${access}`;
    const refresh = authStore.getRefreshToken();
    if (refresh) h["X-Refresh-Token"] = refresh;
    return h;
  },
  // Interceptor de 401: el access token dura 15 min. Si una request autenticada
  // expira, refrescamos el token de forma transparente y reintentamos una vez.
  fetch: async (req, init) => {
    // Clon para reintentar: el body del original se consume en el primer fetch.
    const retryReq = req.clone();
    const res = await fetch(req, { ...init, credentials: "include" });

    // No tocamos respuestas OK ni el propio endpoint de refresh (evita loops).
    if (res.status !== 401 || req.url.endsWith("/auth/refresh")) return res;

    const ok = await refreshAccessToken();
    if (!ok) return res;

    const headers = new Headers(retryReq.headers);
    const access = authStore.getAccessToken();
    if (access) headers.set("Authorization", `Bearer ${access}`);
    return fetch(new Request(retryReq, { headers }), {
      ...init,
      credentials: "include",
    });
  },
});

const client = createORPCClient<AppClient>(link);

export const orpc = createTanstackQueryUtils(client);
