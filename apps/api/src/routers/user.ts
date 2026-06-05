import { ORPCError } from "@orpc/server";

import { createPaymentMethodSchema } from "@subaspedia/types/forms/payment";
import { authed } from "@/api/context";
import { paymentMethods } from "@/api/db/schema";

export const userRouter = {
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
};
