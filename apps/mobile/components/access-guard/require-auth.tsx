import { Redirect } from "expo-router";

import { useAuth } from "@/lib/auth";

export function RequireAuth() {
  const { isAuthed } = useAuth();

  if (!isAuthed) return <Redirect href="/login" />;

  return null;
}
