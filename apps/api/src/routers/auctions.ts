import { and, eq, inArray, like } from "drizzle-orm";
import { z } from "zod";

import { pub } from "@/api/context";
import {
  artworkDetails,
  auctions,
  catalogItems,
  catalogs,
  owners,
  people,
  photos,
  products,
} from "@/api/db/schema";

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

      const auctionRows = await context.db
        .select()
        .from(auctions)
        .where(and(...conditions))
        .all();

      if (auctionRows.length === 0) return [];

      const auctionIds = auctionRows.map(a => a.id);

      const photoRows = await context.db
        .select({
          auctionId: catalogs.auctionId,
          productId: photos.productId,
          photoId: photos.id,
        })
        .from(catalogs)
        .innerJoin(catalogItems, eq(catalogItems.catalogId, catalogs.id))
        .innerJoin(photos, eq(photos.productId, catalogItems.productId))
        .where(inArray(catalogs.auctionId, auctionIds))
        .all();

      // Por subasta: la primera foto de cada producto, hasta 4 productos
      const byAuction = new Map<number, Map<number, number>>();
      for (const r of photoRows.sort((a, b) => a.photoId - b.photoId)) {
        if (r.auctionId == null) continue;
        let perProduct = byAuction.get(r.auctionId);
        if (!perProduct) {
          perProduct = new Map();
          byAuction.set(r.auctionId, perProduct);
        }
        if (!perProduct.has(r.productId))
          perProduct.set(r.productId, r.photoId);
      }

      return auctionRows.map(a => {
        const perProduct = byAuction.get(a.id);
        const photoIds = perProduct
          ? Array.from(perProduct.values()).slice(0, 4)
          : [];
        return { ...a, photoIds };
      });
    }),

  listCatalog: pub
    .input(z.object({ auctionId: z.number().int().positive() }))
    .handler(async ({ context, input }) => {
      const items = await context.db
        .select({
          id: products.id,
          name: products.name,
          description: products.fullDescription,
          catalogDescription: products.catalogDescription,
          basePrice: catalogItems.basePrice,
          ownerName: people.name,
          artist: artworkDetails.artist,
          creationDate: artworkDetails.creationDate,
          history: artworkDetails.history,
        })
        .from(catalogs)
        .innerJoin(catalogItems, eq(catalogItems.catalogId, catalogs.id))
        .innerJoin(products, eq(products.id, catalogItems.productId))
        .leftJoin(owners, eq(owners.id, products.ownerId))
        .leftJoin(people, eq(people.id, owners.id))
        .leftJoin(artworkDetails, eq(artworkDetails.productId, products.id))
        .where(eq(catalogs.auctionId, input.auctionId))
        .all();

      if (items.length === 0) return [];

      const photoRows = await context.db
        .select({
          id: photos.id,
          productId: photos.productId,
        })
        .from(photos)
        .where(
          inArray(
            photos.productId,
            items.map(i => i.id),
          ),
        )
        .all();

      const allByProduct = new Map<number, number[]>();
      for (const p of photoRows.sort((a, b) => a.id - b.id)) {
        let arr = allByProduct.get(p.productId);
        if (!arr) {
          arr = [];
          allByProduct.set(p.productId, arr);
        }
        arr.push(p.id);
      }

      return items.map(i => {
        const photoIds = allByProduct.get(i.id) ?? [];
        const isArtwork = i.artist !== null;
        return {
          id: i.id,
          name: i.name,
          description: i.description,
          catalogDescription: i.catalogDescription,
          basePrice: i.basePrice,
          ownerName: i.ownerName,
          photoId: photoIds[0] ?? null,
          photoIds,
          kind: isArtwork ? ("artwork" as const) : ("object" as const),
          artist: i.artist,
          creationDate: i.creationDate,
          history: i.history,
        };
      });
    }),
};
