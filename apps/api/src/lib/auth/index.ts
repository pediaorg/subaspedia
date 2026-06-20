import { sign } from "hono/jwt";
import { z } from "zod";

import type { AccessClaims } from "./types";

export * from "./types";

export const ACCESS_TTL = 60 * 15; // 15 min
export const REFRESH_TTL = 60 * 60 * 24 * 30; // 30 días
export const REFRESH_COOKIE = "refresh_token";
const PBKDF2_ITERATIONS = 100_000;

export type CookieDirective = {
  name: string;
  value: string;
  options?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    maxAge?: number;
    path?: string;
  };
};

export function serializeCookie({
  name,
  value,
  options = {},
}: CookieDirective) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  parts.push(`Path=${options.path ?? "/"}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join("; ");
}

export function parseRefreshCookie(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === REFRESH_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function getRefreshCookieSafely(cookie: string | null) {
  // Le hace mimick a schema.safeParse
  return cookie
    ? { success: true as const, data: cookie as string, error: null }
    : { success: false as const, data: null, error: true };
}

export const credentials = z.object({
  email: z.email().toLowerCase(),
  password: z.string().min(8).max(128),
});

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bufToHex(salt.buffer)}$${bufToHex(bits)}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, iterStr, saltHex, hashHex] = stored.split("$");
  if (scheme !== "pbkdf2") return false;
  const iterations = Number.parseInt(iterStr, 10);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: hexToBuf(saltHex),
      iterations,
      hash: "SHA-256",
    },
    key,
    256,
  );
  const computed = bufToHex(bits);
  if (computed.length !== hashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ hashHex.charCodeAt(i);
  }
  return diff === 0;
}

export async function issueAccessToken(
  userId: number,
  claims: AccessClaims,
  secret: string,
) {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: userId,
      type: "access",
      iat: now,
      exp: now + ACCESS_TTL,
      category: claims.category,
      hasVerifiedPaymentMethod: claims.hasVerifiedPaymentMethod,
    },
    secret,
  );
}

export async function issueTokens(
  userId: number,
  claims: AccessClaims,
  secret: string,
) {
  const accessToken = await issueAccessToken(userId, claims, secret);
  const now = Math.floor(Date.now() / 1000);
  const refreshToken = await sign(
    { sub: userId, type: "refresh", iat: now, exp: now + REFRESH_TTL },
    secret,
  );
  return { accessToken, refreshToken };
}
