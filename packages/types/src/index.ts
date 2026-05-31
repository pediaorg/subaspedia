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
