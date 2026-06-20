import { Redirect, usePathname } from "expo-router";

import { useAuth } from "@/lib/auth";

export function RequireAuth() {
  const { isAuthed } = useAuth();
  const pathname = usePathname();

  // Llevamos la ruta que el usuario quería ver como query param, para volver
  // ahí una vez que se autentique (login o registro completo).
  if (!isAuthed)
    return (
      <Redirect href={{ pathname: "/login", params: { redirect: pathname } }} />
    );

  return null;
}
