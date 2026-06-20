import { ORPCError } from "@orpc/server";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { createPaymentMethodSchema } from "@subaspedia/types/forms/payment";
import {
  MAX_PAYMENT_METHODS,
  paymentMethodSchema,
} from "@subaspedia/types/payment-method";
import { rankSummarySchema } from "@subaspedia/types/user";
import { authed } from "@/api/context";
import { attendees, bids, paymentMethods } from "@/api/db/schema";

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
      },
    };
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
};
