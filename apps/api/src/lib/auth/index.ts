import { sign } from "hono/jwt";
import { z } from "zod";

export * from "./types";

export const ACCESS_TTL = 60 * 15; // 15 min
export const REFRESH_TTL = 60 * 60 * 24 * 30; // 30 días
const PBKDF2_ITERATIONS = 100_000;

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

export async function issueTokens(userId: number, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = await sign(
    { sub: userId, type: "access", iat: now, exp: now + ACCESS_TTL },
    secret,
  );
  const refreshToken = await sign(
    { sub: userId, type: "refresh", iat: now, exp: now + REFRESH_TTL },
    secret,
  );
  return { accessToken, refreshToken };
}
