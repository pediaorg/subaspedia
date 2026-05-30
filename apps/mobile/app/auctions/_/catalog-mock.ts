// TODO: reemplazar por datos reales de la API.

type ProductBase = {
  id: string;
  name: string;
  category: string;
  image: string;
  images: string[];
  pieceNumber: string;
  description: string;
  currentOwner: string;
  basePrice: number;
  composedOf: number;
  composedImages: string[];
};

export type ObjectProduct = ProductBase & { kind: "object" };

export type ArtworkProduct = ProductBase & {
  kind: "artwork";
  artist: string;
  date: string;
  history: string;
};

export type Product = ObjectProduct | ArtworkProduct;

const PH = (seed: string) => `https://placehold.co/600x400?text=${seed}`;
const THUMBS = ["1", "2", "3"].map(PH);

export const MOCK_PRODUCTS: Product[] = [
  {
    kind: "object",
    id: "1",
    name: "Taza de té",
    category: "Utensilios de cocina",
    image: PH("Taza"),
    images: THUMBS,
    pieceNumber: "A-001",
    description:
      "Taza de té de porcelana con motivos florales. En excelente estado de conservación.",
    currentOwner: "Juan I. Casareski",
    basePrice: 7000,
    composedOf: 3,
    composedImages: THUMBS,
  },
  {
    kind: "object",
    id: "2",
    name: "Tetera",
    category: "Utensilios de cocina",
    image: PH("Tetera"),
    images: THUMBS,
    pieceNumber: "A-002",
    description:
      "Set de té muy bonito. Del año 1863 oficial de la tienda Flores Té valuado en un alto precio por su gran estilo.",
    currentOwner: "Juan I. Casareski",
    basePrice: 7000,
    composedOf: 3,
    composedImages: THUMBS,
  },
  {
    kind: "artwork",
    id: "3",
    name: "Retrato clásico",
    category: "Obra de arte",
    image: PH("Obra"),
    images: THUMBS,
    pieceNumber: "B-014",
    description:
      "Óleo sobre lienzo en muy buen estado. Pieza destacada de la colección.",
    artist: "Antonio Berni",
    date: "1932",
    history:
      "Exhibida originalmente en la Galería del Sur y restaurada en 1998.",
    currentOwner: "María L. Gómez",
    basePrice: 150000,
    composedOf: 1,
    composedImages: THUMBS,
  },
];
