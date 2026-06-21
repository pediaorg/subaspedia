import { z } from "zod";

export const auctionCategory = z.enum([
  "common",
  "special",
  "silver",
  "gold",
  "platinum",
]);

export type AuctionCategory = z.infer<typeof auctionCategory>;

// `currency` vive en ./currency (módulo sin dependencias) para evitar el ciclo
// index -> auction -> index. Se re-exporta acá para no cambiar el punto de
// importación público (`@subaspedia/types`).
export { type Currency, currency } from "./currency";

export const PRODUCT_CATEGORIES = [
  { value: auctionCategory.enum.common, label: "Común" },
  { value: auctionCategory.enum.special, label: "Especial" },
  { value: auctionCategory.enum.silver, label: "Plata" },
  { value: auctionCategory.enum.gold, label: "Oro" },
  { value: auctionCategory.enum.platinum, label: "Platino" },
] as { value: AuctionCategory; label: string }[];

export const ACCESS_CLAIMS = z.object({
  category: auctionCategory.nullable(),
  hasVerifiedPaymentMethod: z.boolean(),
});

export type AccessClaims = z.infer<typeof ACCESS_CLAIMS>;

export const JWT_PAYLOAD = z.object({
  sub: z.number().int().positive(),
  type: z.enum(["access", "refresh"]),
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
  category: auctionCategory.nullable().optional(),
  hasVerifiedPaymentMethod: z.boolean().optional(),
});

export type JWTPayload = z.infer<typeof JWT_PAYLOAD>;

// Protocolo del WebSocket de subasta en vivo. Va al final del módulo: estos
// tipos reutilizan `currency` (definido arriba), así que la referencia ya está
// resuelta cuando el submódulo se evalúa.
export * from "./auction";
