import { photoUri } from "@/lib/photo";

export const RANKS = ["Común", "Especial", "Plata", "Oro", "Platino"] as const;
export type Ranks = (typeof RANKS)[number];

export type Auction = {
  id: string;
  name: string;
  rank: Ranks;
  images: string[];
};

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
