import { z } from "zod";

export const auctionCategory = z.enum([
  "common",
  "special",
  "silver",
  "gold",
  "platinum",
]);

export type AuctionCategory = z.infer<typeof auctionCategory>;

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
