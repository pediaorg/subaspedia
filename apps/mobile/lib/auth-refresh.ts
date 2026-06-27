import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { Platform } from "react-native";

import type { AppClient } from "@/api/rpc";
import { authStore } from "@/lib/auth";

const isWeb = Platform.OS === "web";
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.11:8787";

// Margen para refrescar el access token un poco antes de que su TTL llegue a 0,
// evitando mandar un request que el server rechazaría por vencido.
const EXPIRY_SKEW_SECONDS = 15;

function getExp(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded)) as { exp?: number };
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

function isExpired(token: string | null, skewSeconds = 0): boolean {
  const exp = getExp(token);
  // Si no podemos leer el exp, dejamos que el servidor decida (camino reactivo).
  if (exp == null) return false;
  const now = Date.now() / 1000;
  return exp - skewSeconds <= now;
}

/** El access token (clave de "auth") venció o está por vencer. */
export function accessTokenExpired(): boolean {
  return isExpired(authStore.getAccessToken(), EXPIRY_SKEW_SECONDS);
}

/**
 * La sesión (refresh token) venció. En native lo sabemos por el exp del token;
 * en web vive en una cookie httpOnly que no podemos inspeccionar, así que ahí
 * solo se detecta cuando el endpoint de refresh responde 401.
 */
export function sessionExpired(): boolean {
  if (isWeb) return false;
  return isExpired(authStore.getRefreshToken(), 0);
}

/** Termina la sesión: limpia tokens. La UI reacciona vía useAuth/useSyncExternalStore. */
export function logout() {
  authStore.set(null);
}

// Cliente oRPC "crudo": manda el refresh token pero NO pasa por el interceptor de
// refresh (evita recursión). Sirve únicamente para llamar a auth.refresh.
const rawLink = new RPCLink({
  url: `${API_URL}/rpc`,
  headers: () => {
    const h: Record<string, string> = {};
    if (!isWeb) h["X-Client"] = "native";
    const refresh = authStore.getRefreshToken();
    if (refresh) h["X-Refresh-Token"] = refresh;
    return h;
  },
  fetch: (req, init) => fetch(req, { ...init, credentials: "include" }),
});

const rawClient = createORPCClient<AppClient>(rawLink);

// Dedupe: si varios requests detectan el access vencido a la vez, comparten un
// único refresh en vuelo.
let inflight: Promise<string> | null = null;

/**
 * Obtiene un nuevo access token usando el refresh token.
 * - Éxito: actualiza el store y devuelve el nuevo access token.
 * - Sesión vencida (refresh inválido/expirado o 401 del server): hace logout y
 *   relanza el error.
 */
export function refreshAccessToken(): Promise<string> {
  // En native podemos cortar antes: si la sesión ya venció, no vale la pena
  // pegarle al server.
  if (sessionExpired()) {
    logout();
    return Promise.reject(
      new ORPCError("UNAUTHORIZED", { message: "Sesión vencida" }),
    );
  }

  if (!inflight) {
    inflight = (async () => {
      try {
        const { accessToken } = await rawClient.auth.refresh();
        authStore.setAccessToken(accessToken);
        return accessToken;
      } catch (err) {
        // El refresh token (clave de sesión) ya no sirve => sesión terminada.
        if (err instanceof ORPCError && err.status === 401) logout();
        throw err;
      } finally {
        inflight = null;
      }
    })();
  }

  return inflight;
}
