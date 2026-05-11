import { useSyncExternalStore } from "react";

type Tokens = { accessToken: string; refreshToken: string };

const STORAGE_KEY = "subaspedia:auth";

function read(): Tokens | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

let current: Tokens | null = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const authStore = {
  get: () => current,
  getAccessToken: () => current?.accessToken ?? null,
  set: (tokens: Tokens | null) => {
    current = tokens;
    if (typeof localStorage !== "undefined") {
      if (tokens) localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
      else localStorage.removeItem(STORAGE_KEY);
    }
    emit();
  },
  subscribe: (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

export function useAuth() {
  const tokens = useSyncExternalStore(
    authStore.subscribe,
    authStore.get,
    () => null,
  );
  return { tokens, isAuthed: !!tokens };
}
