// TODO: reemplazar por datos reales de la API.

type ProductBase = {
  id: string;
  name: string;
  category: string;
  image: string;
  images: string[];
  description: string;
  currentOwner: string;
  basePrice: number;
};

export type ObjectProduct = ProductBase & { kind: "object" };

export type ArtworkProduct = ProductBase & {
  kind: "artwork";
  artist: string;
  date: string;
  history: string;
};

export type Product = ObjectProduct | ArtworkProduct;
