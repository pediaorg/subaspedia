import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Product, ProductStatus } from "@subaspedia/types/product";

const MY_PRODUCTS_QUERY_KEY = ["products", "mine"] as const;

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Taza de té",
    category: "Utensilios",
    status: "approved",
    img: "https://picsum.photos/seed/teacup/200",
    proposalText: null,
    proposedBasePrice: null,
    proposedCommission: null,
    salePrice: null,
    saleDate: null,
    auctionId: 101,
  },
  {
    id: 2,
    name: "Taza de café",
    category: "Utensilios",
    status: "under_review",
    img: "https://picsum.photos/seed/coffeecup/200",
    proposalText: null,
    proposedBasePrice: null,
    proposedCommission: null,
    salePrice: null,
    saleDate: null,
    auctionId: null,
  },
  {
    id: 3,
    name: "Tetera de porcelana",
    category: "Utensilios",
    status: "appraised",
    img: "https://picsum.photos/seed/teapot/200",
    proposalText:
      "Estimado/a cliente:\n\nLuego de evaluar detenidamente su Tetera de porcelana, nuestro equipo de tasación considera que la pieza presenta un excelente estado de conservación y cuenta con valor histórico relevante.\n\nNos complace ofrecerle incluirla en nuestra próxima subasta bajo las siguientes condiciones, sujetas a su aprobación.",
    proposedBasePrice: 850000,
    proposedCommission: 12,
    salePrice: null,
    saleDate: null,
    auctionId: null,
  },
  {
    id: 4,
    name: "Piano de cola Yamaha",
    category: "Instrumentos",
    status: "rejected",
    img: "https://picsum.photos/seed/piano/200",
    proposalText: null,
    proposedBasePrice: null,
    proposedCommission: null,
    salePrice: null,
    saleDate: null,
    auctionId: null,
  },
  {
    id: 5,
    name: "Reloj de bolsillo",
    category: "Joyería",
    status: "auctioned",
    img: "https://picsum.photos/seed/watch/200",
    proposalText: null,
    proposedBasePrice: null,
    proposedCommission: null,
    salePrice: 340000,
    saleDate: "2026-04-12T15:00:00.000Z",
    auctionId: 95,
  },
];

export function useMyProducts() {
  return useQuery({
    queryKey: MY_PRODUCTS_QUERY_KEY,
    queryFn: async (): Promise<Product[]> => {
      await new Promise(r => setTimeout(r, 200));
      return MOCK_PRODUCTS;
    },
    staleTime: 1000 * 60 * 5,
  });
}

type UpdateProductStatusInput = {
  productId: number;
  newStatus: ProductStatus;
};

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: UpdateProductStatusInput,
    ): Promise<UpdateProductStatusInput> => {
      await new Promise(r => setTimeout(r, 300));
      return input;
    },
    onSuccess: ({ productId, newStatus }) => {
      queryClient.setQueryData<Product[]>(MY_PRODUCTS_QUERY_KEY, prev =>
        prev?.map(p => (p.id === productId ? { ...p, status: newStatus } : p)),
      );
    },
  });
}
