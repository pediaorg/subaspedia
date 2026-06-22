import { ORPCError } from "@orpc/server";
import { z } from "zod";

import {
  createNotificationSchema,
  notificationSchema,
} from "@subaspedia/types/notification";
import { authed, pub } from "@/api/context";
import { notifications } from "@/api/db/schema";
import { toIso } from "@/api/lib/date";

export const notificationsRouter = {
  // GET /notifications — lista las notificaciones del client logueado, más
  // nuevas primero. Si la persona no es client todavía (sin categoría), la
  // tabla no tiene filas suyas y devuelve [].
  list: authed
    .output(z.array(notificationSchema))
    .handler(async ({ context }) => {
      const rows = await context.db.query.notifications.findMany({
        where: { clientId: context.userId },
        orderBy: { id: "desc" },
      });
      return rows.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        route: n.route,
        targetId: n.targetId,
        createdAt: toIso(n.createdAt),
      }));
    }),

  // GET /notifications/{id} — detalle de una notificación del client logueado.
  get: authed
    .input(z.object({ id: z.number().int().positive() }))
    .output(notificationSchema)
    .handler(async ({ context, input }) => {
      const row = await context.db.query.notifications.findFirst({
        where: { id: input.id, clientId: context.userId },
      });
      if (!row)
        throw new ORPCError("NOT_FOUND", {
          message: "Notificación no encontrada",
        });
      return {
        id: row.id,
        title: row.title,
        body: row.body,
        route: row.route,
        targetId: row.targetId,
        createdAt: toIso(row.createdAt),
      };
    }),

  // POST /notifications — crea una notificación para un client. Público porque
  // hoy lo dispara el backoffice (no hay rol de empleado logueado en la demo,
  // mismo criterio que el resto de backofficeRouter). A futuro: restringir a
  // empleados o disparar desde los handlers de dominio (asignación de
  // categoría, verificación de medio de pago, multa, etc).
  create: pub
    .input(createNotificationSchema)
    .handler(async ({ context, input }) => {
      const client = await context.db.query.clients.findFirst({
        where: { id: input.clientId },
        columns: { id: true },
      });
      if (!client)
        throw new ORPCError("NOT_FOUND", { message: "Client no encontrado" });

      const [created] = await context.db
        .insert(notifications)
        .values({
          clientId: input.clientId,
          title: input.title,
          body: input.body,
          route: input.route,
          targetId: input.targetId ?? null,
        })
        .returning({ id: notifications.id });

      return { id: created.id };
    }),
};
