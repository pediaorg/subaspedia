import { newProductSchema } from "@subaspedia/types/forms";

import { authed } from "../context";
import { photos, products } from "../db/schema";

export const productsRouter = {
  create: authed.input(newProductSchema).handler(async ({ context, input }) => {
    return context.db.transaction(async tx => {
      const [created] = await tx
        .insert(products)
        .values({
          name: input.name,
          fullDescription: input.description ?? "",
          catalogDescription: input.interest || "None",
          available: false,
          ownerId: context.userId,
          reviewerId: 0,
        })
        .returning({ id: products.id });

      await tx.insert(photos).values(
        input.images.map(image => ({
          productId: created.id,
          photo: Buffer.from(image, "base64"),
        })),
      );

      return { success: true, id: created.id };
    });
  }),
};
