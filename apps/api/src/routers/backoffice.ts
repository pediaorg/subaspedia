import { ORPCError } from "@orpc/server";
import { eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { auctionCategory } from "@subaspedia/types";
import { type Context, pub } from "@/api/context";
import { clients, employees, paymentMethods, people } from "@/api/db/schema";
import {
  sendCategoryAssignedEmail,
  sendPaymentMethodVerifiedEmail,
} from "@/api/lib/email";

// El backoffice representa procesos internos de la empresa (investigación de
// postores, validación de medios de pago) que NO forman parte de la app del
// usuario. Esta pantalla existe solo para poder demostrar esos pasos asíncronos.
// Por eso los endpoints son públicos: no hay rol/empleado logueado en la demo.

// Toda acción del backoffice queda "firmada" por un empleado (clients.verifier_id
// es NOT NULL). En la demo no hay empleados reales, así que garantizamos uno por
// defecto y usamos su id como verificador.
async function ensureDefaultEmployee(db: Context["db"]): Promise<number> {
  const existing = await db.query.employees.findFirst({
    columns: { id: true },
  });
  if (existing) return existing.id;

  const [person] = await db
    .insert(people)
    .values({ name: "Backoffice", status: "active" })
    .returning({ id: people.id });
  await db.insert(employees).values({ id: person.id, position: "Analista" });
  return person.id;
}

export const backofficeRouter = {
  // --- Investigación de postores (paso 2 del flujo) ---

  // Personas registradas (tienen cuenta) que todavía no fueron investigadas:
  // existen en `people` pero no tienen fila en `clients`, por lo que su
  // categoría es null y la app las trata como "en revisión".
  pendingClients: pub.handler(async ({ context }) => {
    // Anti-join (personas sin fila en `clients`): RQB no lo expresa, así que
    // se mantiene el query builder de SQL.
    const rows = await context.db
      .select({
        id: people.id,
        name: people.name,
        email: people.email,
        address: people.address,
        createdAt: people.createdAt,
      })
      .from(people)
      .leftJoin(clients, eq(clients.id, people.id))
      .where(isNull(clients.id));

    // Solo nos interesan las personas con cuenta (email) que no son clients.
    return rows.filter(r => r.email !== null);
  }),

  // Asigna una categoría tras la investigación: materializa al postor como
  // `client` admitido. A partir de acá su JWT lleva la categoría y puede ver
  // precios base y subastas de su categoría o inferior.
  assignCategory: pub
    .input(
      z.object({
        personId: z.number().int().positive(),
        category: auctionCategory,
      }),
    )
    .handler(async ({ context, input }) => {
      const person = await context.db.query.people.findFirst({
        where: { id: input.personId },
        columns: { id: true, email: true },
      });
      if (!person)
        throw new ORPCError("NOT_FOUND", { message: "Persona no encontrada" });

      const already = await context.db.query.clients.findFirst({
        where: { id: input.personId },
        columns: { id: true },
      });
      if (already)
        throw new ORPCError("CONFLICT", {
          message: "La persona ya tiene categoría asignada",
        });

      const verifierId = await ensureDefaultEmployee(context.db);
      await context.db.insert(clients).values({
        id: input.personId,
        category: input.category,
        admitted: true,
        verifierId,
      });

      // Le avisamos que ya puede ingresar a la app y completar el registro.
      if (person.email)
        await sendCategoryAssignedEmail(person.email, input.category);

      return { success: true };
    }),

  // --- Validación de medios de pago (paso 5 del flujo) ---

  // Medios de pago cargados por los clientes que aún no fueron verificados por
  // la empresa.
  pendingPaymentMethods: pub.handler(async ({ context }) => {
    const rows = await context.db.query.paymentMethods.findMany({
      where: { verified: false },
      columns: {
        id: true,
        clientId: true,
        type: true,
        amount: true,
        details: true,
        photo: true,
      },
      with: {
        client: { with: { person: { columns: { name: true } } } },
      },
    });

    return rows.flatMap(({ client, ...pm }) =>
      client?.person ? [{ ...pm, clientName: client.person.name }] : [],
    );
  }),

  // Acepta un medio de pago: lo marca como verificado y le fija el monto
  // garantizado. La suma de los `amount` verificados es el límite de compra del
  // cliente.
  acceptPaymentMethod: pub
    .input(
      z.object({
        paymentMethodId: z.number().int().positive(),
        amount: z.number().positive(),
      }),
    )
    .handler(async ({ context, input }) => {
      const pm = await context.db.query.paymentMethods.findFirst({
        where: { id: input.paymentMethodId },
        columns: { id: true, verified: true, clientId: true },
      });
      if (!pm)
        throw new ORPCError("NOT_FOUND", {
          message: "Medio de pago no encontrado",
        });
      if (pm.verified)
        throw new ORPCError("CONFLICT", {
          message: "El medio de pago ya está verificado",
        });

      await context.db
        .update(paymentMethods)
        .set({ verified: true, amount: input.amount })
        .where(eq(paymentMethods.id, input.paymentMethodId));

      // Le avisamos que con un medio de pago verificado ya puede pujar.
      const client = await context.db.query.people.findFirst({
        where: { id: pm.clientId },
        columns: { email: true },
      });
      if (client?.email) await sendPaymentMethodVerifiedEmail(client.email);

      return { success: true };
    }),
};
