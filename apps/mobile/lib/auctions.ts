import type { Currency } from "@subaspedia/types";
import type { UserCategory } from "@subaspedia/types/user";

import { photoUri } from "@/lib/photo";

export const RANKS = ["Común", "Especial", "Plata", "Oro", "Platino"] as const;
export type Ranks = (typeof RANKS)[number];

// Rango (etiqueta en español) -> categoría del dominio (enum en inglés), para
// pasarle el rango de la subasta al RankBadge.
export const RANK_TO_CATEGORY: Record<Ranks, UserCategory> = {
  Común: "common",
  Especial: "special",
  Plata: "silver",
  Oro: "gold",
  Platino: "platinum",
};

export type Auction = {
  id: string;
  name: string;
  rank: Ranks;
  images: string[];
};

type ProductBase = {
  id: string;
  name: string;
  category: string;
  image: string;
  images: string[];
  description: string;
  currentOwner: string;
  basePrice: number;
  currency: Currency;
};

export type ObjectProduct = ProductBase & { kind: "object" };

export type ArtworkProduct = ProductBase & {
  kind: "artwork";
  artist: string;
  date: string;
  history: string;
};

export type Product = ObjectProduct | ArtworkProduct;

const CATEGORY_TO_RANK: Record<string, Ranks> = {
  common: "Común",
  special: "Especial",
  silver: "Plata",
  gold: "Oro",
  platinum: "Platino",
};

type ActiveAuctionRow = {
  id: number;
  location: string | null;
  category: string | null;
  photoIds: number[];
};

/** Mapea las filas de `auctions.listActive` al formato que usa AuctionCard. */
export function toAuctions(rows: ActiveAuctionRow[] | undefined): Auction[] {
  return (rows ?? []).map(a => ({
    id: String(a.id),
    name: a.location ?? "",
    rank: (a.category && CATEGORY_TO_RANK[a.category]) || "Común",
    images: a.photoIds
      .map(id => photoUri(id))
      .filter((u): u is string => u !== null),
  }));
}
