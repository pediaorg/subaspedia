import * as SecureStore from "expo-secure-store";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Platform } from "react-native";

import type { AuctionCategory } from "@subaspedia/types";

const ACCESS_KEY = "subaspedia_access_token";
const REFRESH_KEY = "subaspedia_refresh_token";

const isWeb = Platform.OS === "web";
const hasLocalStorage = typeof localStorage !== "undefined";

const storage = {
  get: (k: string): string | null => {
    if (isWeb) {
      return hasLocalStorage ? localStorage.getItem(k) : null;
    }
    return SecureStore.getItem(k);
  },
  set: (k: string, v: string) => {
    if (isWeb && hasLocalStorage) return localStorage.setItem(k, v);

    SecureStore.setItem(k, v);
  },
  del: (k: string) => {
    if (isWeb && hasLocalStorage) return localStorage.removeItem(k);

    SecureStore.deleteItemAsync(k);
  },
};

type Tokens = { accessToken: string | null; refreshToken: string | null };

let current: Tokens = {
  accessToken: storage.get(ACCESS_KEY),
  refreshToken: isWeb ? null : storage.get(REFRESH_KEY),
};
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const authStore = {
  get: () => current,
  getAccessToken: () => current.accessToken,
  getRefreshToken: () => current.refreshToken,
  set: (tokens: { accessToken: string; refreshToken?: string } | null) => {
    if (tokens) {
      current = {
        accessToken: tokens.accessToken,
        refreshToken: isWeb ? null : (tokens.refreshToken ?? null),
      };
      storage.set(ACCESS_KEY, tokens.accessToken);
      if (!isWeb && tokens.refreshToken)
        storage.set(REFRESH_KEY, tokens.refreshToken);
    } else {
      current = { accessToken: null, refreshToken: null };
      storage.del(ACCESS_KEY);
      if (!isWeb) storage.del(REFRESH_KEY);
    }
    emit();
  },
  // Reemplaza solo el access token (tras un refresh) sin tocar el refresh token.
  setAccessToken: (accessToken: string) => {
    current = { ...current, accessToken };
    storage.set(ACCESS_KEY, accessToken);
    emit();
  },
  subscribe: (cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

type Claims = {
  category: AuctionCategory | null;
  hasVerifiedPaymentMethod: boolean;
};

const EMPTY_CLAIMS: Claims = {
  category: null,
  hasVerifiedPaymentMethod: false,
};

function decodeClaims(token: string | null): Claims {
  if (!token) return EMPTY_CLAIMS;
  try {
    const payload = token.split(".")[1];
    if (!payload) return EMPTY_CLAIMS;
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const parsed = JSON.parse(atob(padded)) as Partial<Claims>;
    return {
      category: parsed.category ?? null,
      hasVerifiedPaymentMethod: !!parsed.hasVerifiedPaymentMethod,
    };
  } catch {
    return EMPTY_CLAIMS;
  }
}

export function useAuth() {
  const t = useSyncExternalStore(authStore.subscribe, authStore.get, () => ({
    accessToken: null,
    refreshToken: null,
  }));

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const claims = decodeClaims(t.accessToken);

  return {
    accessToken: t.accessToken,
    isAuthed: !!t.accessToken,
    loading: !hydrated,
    ...claims,
    canAccessAuctions: !!claims.category,
    canBid: !!claims.category && claims.hasVerifiedPaymentMethod,
  };
}
