import { ORPCError } from "@orpc/server";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { authed, pub } from "@/api/context";

import {
  attendees,
  auctions,
  bids,
  catalogItems,
  catalogs,
  clients,
} from "../db/schema";

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
      const auctionRows = await context.db.query.auctions.findMany({
        where: {
          status: "open",
          ...(input?.category ? { category: input.category } : {}),
          ...(input?.search && input.search.length > 0
            ? { location: { like: `%${input.search}%` } }
            : {}),
        },
      });

      if (auctionRows.length === 0) return [];

      const auctionIds = auctionRows.map(a => a.id);

      const catalogRows = await context.db.query.catalogs.findMany({
        where: { auctionId: { in: auctionIds } },
        columns: { auctionId: true },
        with: {
          items: {
            columns: {},
            with: {
              product: {
                columns: { id: true },
                with: { photos: { columns: { id: true } } },
              },
            },
          },
        },
      });

      const photoRows = catalogRows.flatMap(c =>
        c.items.flatMap(it =>
          it.product
            ? it.product.photos.map(ph => ({
                auctionId: c.auctionId,
                productId: it.product!.id,
                photoId: ph.id,
              }))
            : [],
        ),
      );

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

  // Productos destacados de subastas abiertas, con la subasta a la que pertenecen.
  listFeatured: pub.handler(async ({ context }) => {
    const auctionRows = await context.db.query.auctions.findMany({
      where: { status: "open" },
      columns: { id: true },
      with: {
        catalogs: {
          columns: {},
          with: {
            items: {
              columns: {},
              with: {
                product: {
                  columns: {
                    id: true,
                    name: true,
                    catalogDescription: true,
                    fullDescription: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const rows = auctionRows.flatMap(a =>
      a.catalogs.flatMap(c =>
        c.items.flatMap(it =>
          it.product
            ? [
                {
                  auctionId: a.id,
                  productId: it.product.id,
                  name: it.product.name,
                  catalogDescription: it.product.catalogDescription,
                  fullDescription: it.product.fullDescription,
                },
              ]
            : [],
        ),
      ),
    );

    if (rows.length === 0) return [];

    const photoRows = await context.db.query.photos.findMany({
      where: { productId: { in: rows.map(r => r.productId) } },
      columns: { id: true, productId: true },
    });

    const firstPhoto = new Map<number, number>();
    for (const p of photoRows.sort((a, b) => a.id - b.id)) {
      if (!firstPhoto.has(p.productId)) firstPhoto.set(p.productId, p.id);
    }

    // Un producto por entrada, hasta 6.
    const seen = new Set<number>();
    const featured: {
      id: number;
      auctionId: number;
      title: string;
      description: string;
      photoId: number | null;
    }[] = [];
    for (const r of rows) {
      if (seen.has(r.productId)) continue;
      seen.add(r.productId);
      featured.push({
        id: r.productId,
        auctionId: r.auctionId,
        title: r.name,
        description: r.catalogDescription ?? r.fullDescription,
        photoId: firstPhoto.get(r.productId) ?? null,
      });
      if (featured.length >= 6) break;
    }
    return featured;
  }),

  listCatalog: pub
    .input(z.object({ auctionId: z.number().int().positive() }))
    .handler(async ({ context, input }) => {
      // Moneda de la subasta (satélite) para formatear los precios; sin fila
      // cae al default 'ARS'. Es la misma para todos los items del catálogo.
      const currencyRow = await context.db.query.auctionCurrencies.findFirst({
        where: { auctionId: input.auctionId },
        columns: { currency: true },
      });
      const currency = currencyRow?.currency ?? "ARS";

      const catalogRows = await context.db.query.catalogs.findMany({
        where: { auctionId: input.auctionId },
        columns: {},
        with: {
          items: {
            columns: { basePrice: true },
            with: {
              product: {
                columns: {
                  id: true,
                  name: true,
                  fullDescription: true,
                  catalogDescription: true,
                },
                with: {
                  owner: {
                    columns: {},
                    with: {
                      person: { columns: { name: true, lastName: true } },
                    },
                  },
                  artworkDetails: {
                    columns: {
                      artist: true,
                      creationDate: true,
                      history: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const items = catalogRows.flatMap(c =>
        c.items.flatMap(it =>
          it.product
            ? [
                {
                  id: it.product.id,
                  name: it.product.name,
                  description: it.product.fullDescription,
                  catalogDescription: it.product.catalogDescription,
                  basePrice: it.basePrice,
                  ownerName:
                    [
                      it.product.owner?.person?.name,
                      it.product.owner?.person?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || null,
                  artist: it.product.artworkDetails?.artist ?? null,
                  creationDate: it.product.artworkDetails?.creationDate ?? null,
                  history: it.product.artworkDetails?.history ?? null,
                },
              ]
            : [],
        ),
      );

      if (items.length === 0) return [];

      const photoRows = await context.db.query.photos.findMany({
        where: { productId: { in: items.map(i => i.id) } },
        columns: { id: true, productId: true },
      });

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
          currency,
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

  // Detalles de una subasta específica
  getDetail: pub
    .input(z.object({ auctionId: z.number().int().positive() }))
    .handler(async ({ context, input }) => {
      const auction = await context.db.query.auctions.findFirst({
        where: { id: input.auctionId },
        with: {
          currencyRow: true,
          catalogs: {
            columns: {},
            with: {
              items: {
                columns: { id: true, basePrice: true },
                with: {
                  product: {
                    columns: { id: true, name: true, fullDescription: true },
                    with: {
                      photos: { columns: { id: true } },
                      owner: {
                        columns: {},
                        with: {
                          person: { columns: { name: true, lastName: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!auction)
        throw new ORPCError("NOT_FOUND", {
          message: "Subasta no encontrada",
        });

      let highestBidAmount = 0;
      let firstPhotoId: number | null = null;

      if (auction.catalogs.length > 0 && auction.catalogs[0].items.length > 0) {
        const firstItem = auction.catalogs[0].items[0];

        const highestBid = await context.db.query.bids.findFirst({
          columns: { amount: true },
          where: { itemId: firstItem.id }, // <-- Sintaxis de objeto restaurada
          orderBy: (t, { desc }) => desc(t.amount),
        });
        highestBidAmount = highestBid?.amount ?? 0;

        if (firstItem.product?.photos && firstItem.product.photos.length > 0) {
          firstPhotoId = firstItem.product.photos[0].id;
        }
      }

      // La moneda sale de la tabla satélite; si la subasta no tiene fila, cae al
      // default 'ARS'. `currencyRow` no se expone crudo en el output.
      const { currencyRow, ...auctionData } = auction;

      return {
        ...auctionData,
        currency: currencyRow?.currency ?? "ARS",
        currentBid: highestBidAmount,
        photoId: firstPhotoId,
        catalogs: auction.catalogs.map(c => ({
          ...c,
          items: c.items.map(it => ({
            ...it,
            product: it.product
              ? {
                  ...it.product,
                  ownerName:
                    [
                      it.product.owner?.person?.name,
                      it.product.owner?.person?.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ") || null,
                }
              : undefined,
          })),
        })),
      };
    }),

  // Obtener todas las pujas de una subasta
  getBids: pub
    .input(z.object({ auctionId: z.number().int().positive() }))
    .handler(async ({ context, input }) => {
      const catalog = await context.db.query.catalogs.findFirst({
        where: { auctionId: input.auctionId },
      });
      if (!catalog) return [];

      const items = await context.db.query.catalogItems.findMany({
        where: { catalogId: catalog.id },
      });
      if (items.length === 0) return [];

      const itemIds = items.map(i => i.id);

      const auctionBids = await context.db.query.bids.findMany({
        // Usamos el operador 'in' nativo de la API de objetos de Drizzle
        where: { itemId: { in: itemIds } },
        orderBy: (t, { desc }) => desc(t.amount),
        with: {
          attendee: {
            columns: { bidderNumber: true },
            with: {
              client: {
                columns: {},
                with: {
                  person: { columns: { name: true } },
                },
              },
            },
          },
          item: {
            columns: { productId: true },
            with: {
              product: { columns: { name: true } },
            },
          },
        },
      });

      return auctionBids.map(bid => ({
        id: bid.id,
        user: bid.attendee?.client?.person?.name ?? "Anónimo",
        amount: bid.amount,
        itemName: bid.item?.product?.name ?? "Producto",
        bidderNumber: bid.attendee?.bidderNumber,
      }));
    }),

  // Realizar una puja (requiere autenticación)
  placeBid: authed
    .input(
      z.object({
        auctionId: z.number().int().positive(),
        amount: z.number().positive("El monto debe ser mayor a 0"),
      }),
    )
    .handler(async ({ context, input }) => {
      const auction = await context.db.query.auctions.findFirst({
        where: { id: input.auctionId, status: "open" },
      });

      if (!auction)
        throw new ORPCError("NOT_FOUND", {
          message: "Subasta no encontrada o cerrada",
        });

      const client = await context.db.query.clients.findFirst({
        where: { id: context.userId },
      });

      if (!client)
        throw new ORPCError("FORBIDDEN", {
          message: "No tienes permiso para pujar",
        });

      let attendee = await context.db.query.attendees.findFirst({
        where: { clientId: client.id, auctionId: input.auctionId },
      });

      if (!attendee) {
        const maxBidder = await context.db.query.attendees.findFirst({
          where: { auctionId: input.auctionId },
          orderBy: (t, { desc }) => desc(t.bidderNumber),
        });

        const newBidderNumber = (maxBidder?.bidderNumber ?? 0) + 1;

        const result = await context.db
          .insert(attendees)
          .values({
            clientId: client.id,
            auctionId: input.auctionId,
            bidderNumber: newBidderNumber,
          })
          .returning();

        attendee = result[0];
      }

      if (!attendee)
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Error al registrar asistente",
        });

      const catalog = await context.db.query.catalogs.findFirst({
        where: { auctionId: input.auctionId },
      });

      if (!catalog)
        throw new ORPCError("NOT_FOUND", {
          message: "No hay catálogo en esta subasta",
        });

      const item = await context.db.query.catalogItems.findFirst({
        where: { catalogId: catalog.id },
      });

      if (!item)
        throw new ORPCError("NOT_FOUND", {
          message: "No hay items en este catálogo",
        });

      const highestBid = await context.db.query.bids.findFirst({
        columns: { amount: true },
        where: { itemId: item.id },
        orderBy: (t, { desc }) => desc(t.amount),
      });

      if (highestBid && input.amount <= highestBid.amount) {
        throw new ORPCError("BAD_REQUEST", {
          message: `El monto debe ser mayor a $${highestBid.amount}`,
        });
      }

      const bidResult = await context.db
        .insert(bids)
        .values({
          attendeeId: attendee.id,
          itemId: item.id,
          amount: input.amount,
          winner: true,
        })
        .returning();

      const newBid = bidResult[0];

      // El UPDATE usa el Query Builder estándar, por eso aquí SÍ mantenemos eq, and y ne
      if (highestBid) {
        await context.db
          .update(bids)
          .set({ winner: false })
          .where(and(eq(bids.itemId, item.id), ne(bids.id, newBid.id)));
      }

      return {
        success: true,
        bidId: newBid.id,
        message: "Puja realizada exitosamente",
      };
    }),
};
