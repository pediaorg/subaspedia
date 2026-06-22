import { z } from "zod";

export const insuranceSchema = z.object({
  productId: z.number().int().positive(),
  productName: z.string(),
  img: z.url(),
  policyNumber: z.string(),
  company: z.string(),
  amount: z.number().positive(),
});

export type Insurance = z.infer<typeof insuranceSchema>;
