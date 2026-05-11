import { useSyncExternalStore } from "react";

const STORAGE_KEY = "subaspedia:access_token";

function read(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

let current: string | null = read();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const authStore = {
  get: () => current,
  getAccessToken: () => current,
  set: (accessToken: string | null) => {
    current = accessToken;
    if (typeof localStorage !== "undefined") {
      if (accessToken) localStorage.setItem(STORAGE_KEY, accessToken);
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
  const token = useSyncExternalStore(
    authStore.subscribe,
    authStore.get,
    () => null,
  );
  return { accessToken: token, isAuthed: !!token };
}
