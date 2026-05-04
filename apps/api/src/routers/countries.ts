import { eq } from "drizzle-orm";
import { z } from "zod";

import { pub } from "../context";
import { countries } from "../db/schema";

export const countriesRouter = {
  list: pub.handler(async ({ context }) => {
    return context.db.query.countries.findMany();
  }),

  getById: pub
    .input(z.object({ id: z.number() }))
    .handler(async ({ context, input }) => {
      const country = await context.db.query.countries.findFirst({
        where: { id: input.id },
      });

      return country ?? null;
    }),

  create: pub
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        shortName: z.string().optional(),
        capital: z.string(),
        nationality: z.string(),
        languages: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      await context.db.insert(countries).values(input);

      return { success: true };
    }),

  update: pub
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        shortName: z.string().optional(),
        capital: z.string().optional(),
        nationality: z.string().optional(),
        languages: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { id, ...data } = input;
      await context.db.update(countries).set(data).where(eq(countries.id, id));

      return { success: true };
    }),

  delete: pub
    .input(z.object({ id: z.number() }))
    .handler(async ({ context, input }) => {
      await context.db.delete(countries).where(eq(countries.id, input.id));

      return { success: true };
    }),
};
