import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { createPaymentMethodSchema } from "@subaspedia/types/forms/payment";
import { paymentMethodSchema } from "@subaspedia/types/payment-method";
import { authed } from "@/api/context";
import { paymentMethods } from "@/api/db/schema";

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
          photo: true,
        },
      });
      return methods.map(m => ({
        id: m.id,
        type: m.type,
        verified: m.verified ?? false,
        details: m.details ?? "",
        photo: m.photo ?? null,
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
        photo: input.photo ?? null,
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
