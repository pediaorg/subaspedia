import { z } from "zod";

import { auctionCategory } from "../index";

export const MIN_PRODUCT_IMAGES = 6;

export const newProductSchema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre"),
  category: auctionCategory.nonoptional("Seleccioná una categoría"),
  stock: z.string().optional(),
  price: z.string().trim().min(1, "Ingresá un precio"),
  description: z.string().optional(),
  interest: z.string().optional(),
  images: z
    .array(z.string())
    .min(MIN_PRODUCT_IMAGES, `Subí al menos ${MIN_PRODUCT_IMAGES} imágenes`),
  acceptConditions: z.boolean().refine(v => v, "Debés aceptar las condiciones"),
  acceptLegally: z.boolean().refine(v => v, "Debés aceptar la declaración"),
  acceptTerms: z.boolean().refine(v => v, "Debés aceptar los términos"),
});

export type NewProductFormInput = z.input<typeof newProductSchema>;
export type NewProductFormOutput = z.output<typeof newProductSchema>;
