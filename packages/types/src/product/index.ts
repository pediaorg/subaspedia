import { z } from "zod";

export const productStatus = z.enum([
  "under_review",
  "appraised",
  "approved",
  "rejected",
  "auctioned",
]);

export type ProductStatus = z.infer<typeof productStatus>;

export const PRODUCT_STATUS_LABELS = [
  { value: productStatus.enum.under_review, label: "En revisión" },
  { value: productStatus.enum.appraised, label: "Tasado" },
  { value: productStatus.enum.approved, label: "Aprobado" },
  { value: productStatus.enum.rejected, label: "Rechazado" },
  { value: productStatus.enum.auctioned, label: "Subastado" },
] as { value: ProductStatus; label: string }[];

export const productSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  category: z.string(),
  status: productStatus,
  img: z.url(),
  proposalText: z.string().nullable(),
  proposedBasePrice: z.number().positive().nullable(),
  proposedCommission: z.number().positive().nullable(),
  salePrice: z.number().positive().nullable(),
  saleDate: z.iso.datetime().nullable(),
  auctionId: z.number().int().positive().nullable(),
});

export type Product = z.infer<typeof productSchema>;
