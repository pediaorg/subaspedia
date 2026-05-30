// Datos mockeados de subastas.
// TODO: reemplazar por datos reales de la API (router de subastas).

export const RANKS = ["Común", "Especial", "Plata", "Oro", "Platino"] as const;
export type Ranks = (typeof RANKS)[number];

export type Auction = {
  id: string;
  name: string;
  rank: Ranks;
  images: string[];
};

const IMAGES = [
  "https://placehold.co/24x24",
  "https://placehold.co/24x24",
  "https://placehold.co/24x24",
];

export const AUCTIONS: Auction[] = Array.from({ length: 6 }, (_, i) => ({
  id: String(i + 1),
  name: `Subasta #${i + 1}`,
  rank: RANKS[i % RANKS.length],
  images: IMAGES,
}));
