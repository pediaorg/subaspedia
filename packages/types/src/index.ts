import { z } from "zod";

export const auctionCategory = z.enum([
  "common",
  "special",
  "silver",
  "gold",
  "platinum",
]);

export type AuctionCategory = z.infer<typeof auctionCategory>;

// Moneda de una subasta (y de lo que deriva de ella: multas, transacciones,
// etc.). La consigna define que cada subasta es en pesos O dólares, nunca
// bimonetaria. Enum transversal: todo lo que herede la moneda de una subasta
// debe reutilizar este enum.
export const currency = z.enum(["ARS", "USD"]);

export type Currency = z.infer<typeof currency>;

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
