import type { Href } from "expo-router";

// Normaliza el query param `redirect` (la ruta que el usuario intentaba ver
// antes de que el guard lo mandara a /login) a un Href interno seguro. Solo
// acepta rutas absolutas internas; cualquier otra cosa cae a home.
export function safeRedirect(redirect?: string | string[]): Href {
  const target = Array.isArray(redirect) ? redirect[0] : redirect;
  return target?.startsWith("/") ? (target as Href) : "/";
}
