import { and, eq, like } from "drizzle-orm";
import { z } from "zod";

import { pub } from "@/api/context";
import { auctions } from "@/api/db/schema";

const CATEGORIES = ["common", "special", "silver", "gold", "platinum"] as const;

export const auctionsRouter = {
  listActive: pub
    .input(
      z
        .object({
          search: z.string().trim().optional(),
          category: z.enum(CATEGORIES).optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const conditions = [eq(auctions.status, "open")];

      if (input?.category) {
        conditions.push(eq(auctions.category, input.category));
      }

      if (input?.search && input.search.length > 0) {
        conditions.push(like(auctions.location, `%${input.search}%`));
      }

      return context.db
        .select()
        .from(auctions)
        .where(and(...conditions))
        .all();
    }),
};
