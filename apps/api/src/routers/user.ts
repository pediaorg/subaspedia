import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { createPaymentMethodSchema } from "@subaspedia/types/forms/payment";
import {
  MAX_PAYMENT_METHODS,
  paymentMethodSchema,
} from "@subaspedia/types/payment-method";
import { penaltySchema, penaltyStatus } from "@subaspedia/types/penalty";
import { transactionSchema } from "@subaspedia/types/transaction";
import { bidHistorySchema, rankSummarySchema } from "@subaspedia/types/user";
import { insuranceSchema } from "@subaspedia/types/insurance";
import { authed } from "@/api/context";
import {
  attendees,
  auctionRecords,
  auctions,
  bids,
  catalogItems,
  paymentMethods,
  penalties,
  products,
  insurances,
  photos,
} from "@/api/db/schema";
import { toIso } from "@/api/lib/date";
import { firstPhotoToImg } from "@/api/lib/photo";

export const userRouter = {
  // GET /users/me/payment-methods — los medios de pago del client logueado.
  // La tabla guarda el detalle enmascarado en `details` (no campos por tipo).
  listPaymentMethods: authed
    .output(z.array(paymentMethodSchema))
    .handler(async ({ context }) => {
      const methods = await context.db.query.paymentMethods.findMany({
        where: { clientId: context.userId },
        columns: {
          id: true,
          type: true,
          verified: true,
          details: true,
        },
      });
      return methods.map(m => ({
        id: m.id,
        type: m.type,
        verified: m.verified ?? false,
        details: m.details ?? "",
      }));
    }),

  addPaymentMethod: authed
    .input(createPaymentMethodSchema)
    .handler(async ({ context, input }) => {
      // userId (people.id) coincide con clients.id. Solo un client (postor con
      // categoría asignada) puede tener medios de pago.
      const client = await context.db.query.clients.findFirst({
        where: { id: context.userId },
        columns: { id: true },
      });
      if (!client)
        throw new ORPCError("FORBIDDEN", {
          message:
            "Necesitás tener una categoría asignada para cargar un medio de pago",
        });

      await context.db.insert(paymentMethods).values({
        clientId: context.userId,
        type: input.type,
        details: input.details,
        verified: false,
      });

      return { success: true };
    }),

  // DELETE /users/me/payment-methods/{id} — borra un medio del client logueado.
  deletePaymentMethod: authed
    .input(z.object({ id: z.number().int().positive() }))
    .handler(async ({ context, input }) => {
      // El where compuesto (id + clientId) garantiza que solo podés borrar tus
      // propios medios; si no matchea ninguno -> 404 (ajeno o inexistente).
      const deleted = await context.db
        .delete(paymentMethods)
        .where(
          and(
            eq(paymentMethods.id, input.id),
            eq(paymentMethods.clientId, context.userId),
          ),
        )
        .returning({ id: paymentMethods.id });

      if (deleted.length === 0)
        throw new ORPCError("NOT_FOUND", {
          message: "Medio de pago no encontrado",
        });

      return { success: true };
    }),

  // GET /users/me/rank-summary — todo lo que muestra la pantalla de Rango en
  // una sola llamada: categoría del client, medios de pago (x/max) y actividad
  // (subastas participadas, ganadas y total ofertado). La actividad sale de
  // bids -> attendees filtrando por el client logueado.
  rankSummary: authed.output(rankSummarySchema).handler(async ({ context }) => {
    const userId = context.userId;

    const client = await context.db.query.clients.findFirst({
      where: { id: userId },
      columns: { category: true },
    });

    const [pmRow] = await context.db
      .select({ value: count() })
      .from(paymentMethods)
      .where(eq(paymentMethods.clientId, userId));

    // Una fila de attendees = una subasta a la que se inscribió el client.
    const [participatedRow] = await context.db
      .select({ value: count() })
      .from(attendees)
      .where(eq(attendees.clientId, userId));

    // Ganadas = pujas marcadas winner; ofertado = suma de todas sus pujas.
    // coalesce para que sum() devuelva 0 (no null) cuando no pujó nunca.
    const [bidStats] = await context.db
      .select({
        won: sql<number>`coalesce(sum(case when ${bids.winner} then 1 else 0 end), 0)`,
        totalBid: sql<number>`coalesce(sum(${bids.amount}), 0)`,
      })
      .from(bids)
      .innerJoin(attendees, eq(bids.attendeeId, attendees.id))
      .where(eq(attendees.clientId, userId));

    // Total pagado = importe + comisión de las ventas que ganó (las filas de
    // registroDeSubasta donde el client es el comprador). `comision` es un
    // PORCENTAJE del importe (p. ej. 12 = 12%), no un monto. Distinto de
    // totalBid (que suma todas sus pujas, ganadas o no).
    const [paidStats] = await context.db
      .select({
        totalPaid: sql<number>`coalesce(sum(${auctionRecords.amount} + ${auctionRecords.amount} * ${auctionRecords.commission} / 100.0), 0)`,
      })
      .from(auctionRecords)
      .where(eq(auctionRecords.clientId, userId));

    // Participaciones agrupadas por categoría de la subasta. Las subastas sin
    // categoría (category null) se descartan del desglose.
    const categoryRows = await context.db
      .select({
        category: auctions.category,
        participated: count(),
      })
      .from(attendees)
      .innerJoin(auctions, eq(attendees.auctionId, auctions.id))
      .where(eq(attendees.clientId, userId))
      .groupBy(auctions.category);

    const byCategory = categoryRows.flatMap(r =>
      r.category
        ? [{ category: r.category, participated: r.participated }]
        : [],
    );

    return {
      category: client?.category ?? null,
      paymentMethods: {
        count: pmRow?.value ?? 0,
        max: MAX_PAYMENT_METHODS,
      },
      activity: {
        participated: participatedRow?.value ?? 0,
        won: Number(bidStats?.won ?? 0),
        totalBid: Number(bidStats?.totalBid ?? 0),
        totalPaid: Number(paidStats?.totalPaid ?? 0),
        byCategory,
      },
    };
  }),

  // GET /users/me/bid-history — todas las pujas del client logueado, de la más
  // reciente a la más vieja (orden por id; la tabla no tiene timestamp). Cada
  // puja trae el nombre del bien y la subasta a la que pertenece.
  bidHistory: authed.output(bidHistorySchema).handler(async ({ context }) => {
    const rows = await context.db
      .select({
        id: bids.id,
        amount: bids.amount,
        winner: bids.winner,
        productName: products.name,
        auctionId: attendees.auctionId,
      })
      .from(bids)
      .innerJoin(attendees, eq(bids.attendeeId, attendees.id))
      .innerJoin(catalogItems, eq(bids.itemId, catalogItems.id))
      .innerJoin(products, eq(catalogItems.productId, products.id))
      .where(eq(attendees.clientId, context.userId))
      .orderBy(desc(bids.id));

    return rows.map(r => ({
      id: r.id,
      productName: r.productName,
      amount: r.amount,
      winner: r.winner ?? false,
      auctionId: r.auctionId,
    }));
  }),

  // GET /users/me/transactions — historial de compras del client logueado. Una
  // fila de registroDeSubasta = una subasta ganada y pagada por el client.
  // Espejo de products.list pero filtrando por comprador (clientId) en vez de
  // dueño; img/fecha/moneda se resuelven igual que ahí (helpers compartidos +
  // tabla satélite monedasSubasta).
  transactions: authed
    .output(z.array(transactionSchema))
    .handler(async ({ context }) => {
      const records = await context.db.query.auctionRecords.findMany({
        where: { clientId: context.userId },
        columns: { id: true, amount: true, commission: true, auctionId: true },
        with: {
          product: {
            columns: { id: true, name: true },
            with: { photos: { columns: { id: true } } },
          },
          auction: {
            columns: { date: true },
            with: { currencyRow: true },
          },
        },
      });

      return records.flatMap(r => {
        // El historial son compras concretadas (subasta cerrada), que siempre
        // tienen producto y fecha. Si por un dato inconsistente faltara alguno,
        // omitimos la fila: productName/date son no-nullable en transactionSchema.
        if (!r.product || !r.auction?.date) return [];
        return [
          {
            id: r.id,
            productName: r.product.name,
            img: firstPhotoToImg(
              r.product.photos[0]?.id,
              context.apiOrigin,
              r.product.id,
            ),
            // Total pagado = puja + comisión. `comision` es un PORCENTAJE de la
            // puja (no un monto), p. ej. 12 = 12%. TODO(envío): sumar el costo
            // de envío cuando se modele.
            amount: r.amount + (r.amount * r.commission) / 100,
            currency: r.auction.currencyRow?.currency ?? "ARS",
            date: toIso(r.auction.date),
            auctionId: r.auctionId,
            // El registro existe -> la subasta se ganó y pagó. TODO(pedido):
            // derivar shipped/delivered/picked_up cuando se modele el envío.
            status: "paid" as const,
          },
        ];
      });
    }),

  // GET /users/me/penalties — las multas del client logueado. Causal única de
  // dominio = falta de pago. El estado 'overdue' (vencida) NO se persiste: se
  // deriva acá comparando venceEl con hoy (regla del proyecto: tiempo en la capa
  // de app). Las fechas se guardan como 'YYYY-MM-DD' -> se normalizan a ISO.
  penalties: authed
    .output(z.array(penaltySchema))
    .handler(async ({ context }) => {
      const rows = await context.db.query.penalties.findMany({
        where: { clientId: context.userId },
        columns: {
          id: true,
          reason: true,
          amount: true,
          currency: true,
          status: true,
          issuedAt: true,
          dueDate: true,
          auctionId: true,
        },
      });

      const now = new Date();
      return rows.map(p => ({
        id: p.id,
        reason: p.reason,
        amount: p.amount,
        currency: p.currency,
        // Una multa pendiente cuyo vencimiento ya pasó se muestra como vencida.
        status:
          p.status === "pending" && new Date(p.dueDate) < now
            ? "overdue"
            : p.status,
        issuedAt: toIso(p.issuedAt),
        dueDate: toIso(p.dueDate),
        auctionId: p.auctionId,
      }));
    }),

  // PUT /users/me/penalties/{id}/status — pagar una multa (-> paid) con un medio
  // de pago elegido. La única transición soportada desde el cliente es a 'paid'
  // ('overdue' es derivado; 'pending' no se revierte).
  payPenalty: authed
    .input(
      z.object({
        id: z.number().int().positive(),
        status: penaltyStatus,
        paymentMethodId: z.number().int().positive(),
      }),
    )
    .handler(async ({ context, input }) => {
      if (input.status !== "paid")
        throw new ORPCError("BAD_REQUEST", {
          message: "Solo se puede marcar la multa como pagada",
        });

      // La multa debe ser del client logueado. En DB solo hay pending/paid: una
      // multa "vencida" es la misma fila pending, así que sigue siendo pagable.
      const penalty = await context.db.query.penalties.findFirst({
        where: { id: input.id, clientId: context.userId },
        columns: { status: true },
      });
      if (!penalty)
        throw new ORPCError("NOT_FOUND", { message: "Multa no encontrada" });
      if (penalty.status === "paid")
        throw new ORPCError("CONFLICT", { message: "La multa ya está pagada" });

      // El medio de pago debe ser del client y estar verificado (mismo criterio
      // que canPayPenaltyWith en el front). TODO(moneda): validar que el medio
      // soporte penalty.currency cuando PaymentMethod modele moneda/scope.
      const method = await context.db.query.paymentMethods.findFirst({
        where: { id: input.paymentMethodId, clientId: context.userId },
        columns: { verified: true },
      });
      if (!method)
        throw new ORPCError("NOT_FOUND", {
          message: "Medio de pago no encontrado",
        });
      if (!method.verified)
        throw new ORPCError("FORBIDDEN", {
          message: "El medio de pago no está verificado",
        });

      await context.db
        .update(penalties)
        .set({ status: "paid" })
        .where(
          and(
            eq(penalties.id, input.id),
            eq(penalties.clientId, context.userId),
          ),
        );

      return { success: true };
    }),

  paymentLimit: authed.handler(async ({ context }) => {
    const client = await context.db.query.clients.findFirst({
      where: { id: context.userId },
      columns: { id: true },
      with: {
        paymentMethods: {
          where: { verified: true },
          columns: { amount: true },
        },
      },
    });

    const limit =
      client?.paymentMethods.reduce((acc, pm) => acc + (pm.amount ?? 0), 0) ??
      0;

    return { limit };
  }),

  // GET /users/me/insurances — las pólizas de seguro de los bienes del dueño logueado.
  insurances: authed
    .output(z.array(insuranceSchema))
    .handler(async ({ context }) => {
      // Unimos los productos del dueño que tengan seguro
      const rows = await context.db
        .select({
          productId: products.id,
          productName: products.name,
          policyNumber: insurances.policyNumber,
          company: insurances.company,
          amount: insurances.amount,
        })
        .from(products)
        .innerJoin(
          insurances,
          eq(products.insurancePolicy, insurances.policyNumber),
        )
        .where(eq(products.ownerId, context.userId));

      // Obtenemos la primera foto de cada producto para la imagen
      const result = await Promise.all(
        rows.map(async row => {
          const productPhoto = await context.db.query.photos.findFirst({
            where: { productId: row.productId },
            columns: { id: true },
          });
          return {
            ...row,
            img: firstPhotoToImg(
              productPhoto?.id,
              context.apiOrigin,
              row.productId,
            ),
          };
        }),
      );

      return result;
    }),
};
