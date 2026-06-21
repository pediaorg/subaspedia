import { ORPCError } from "@orpc/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";

import { auctionCategory, currency } from "@subaspedia/types";
import { type Context, pub } from "@/api/context";
import {
  auctioneers,
  auctions,
  catalogItems,
  catalogs,
  clients,
  employees,
  paymentMethods,
  penalties,
  people,
  products,
} from "@/api/db/schema";
import { toIso } from "@/api/lib/date";
import { generateSetPasswordToken, SET_PASSWORD_TTL_MS } from "@/api/lib/auth";
import {
  sendCategoryAssignedEmail,
  sendPaymentMethodVerifiedEmail,
} from "@/api/lib/email";

// Fecha "YYYY-MM-DD" desplazada `days` días desde hoy (mismo formato que guarda
// el resto del schema). Se usa para emitir multas: issuedAt = hoy, dueDate = +3
// (las 72hs del enunciado para presentar los fondos).
function dateOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// El backoffice representa procesos internos de la empresa (investigación de
// postores, validación de medios de pago, tasación de bienes, armado de
// catálogos y subastas) que NO forman parte de la app del usuario. Esta pantalla
// existe solo para poder demostrar esos pasos asíncronos. Por eso los endpoints
// son públicos: no hay rol/empleado logueado en la demo.

// Toda acción del backoffice queda "firmada" por un empleado (varios FKs son NOT
// NULL: clients.verifier_id, catalogs.manager_id). En la demo no hay empleados
// reales, así que garantizamos uno por defecto y usamos su id.
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

// Una cotización (precio base + comisión + estado) solo puede vivir en
// `catalogItems`, pero esa tabla exige un `catalogId`. Como en el flujo del
// enunciado se cotiza ANTES de armar el catálogo definitivo, usamos un catálogo
// "holding" sin subasta que junta todas las cotizaciones todavía no agrupadas.
// Se identifica por esta descripción centinela y se excluye de los catálogos
// reales (ver listDraftCatalogs).
const HOLDING_CATALOG_DESC = "__cotizaciones_sin_catalogo__";

async function ensureHoldingCatalog(db: Context["db"]): Promise<number> {
  const existing = await db.query.catalogs.findFirst({
    where: { description: HOLDING_CATALOG_DESC },
    columns: { id: true },
  });
  if (existing) return existing.id;

  const managerId = await ensureDefaultEmployee(db);
  const [created] = await db
    .insert(catalogs)
    .values({ description: HOLDING_CATALOG_DESC, managerId })
    .returning({ id: catalogs.id });
  return created.id;
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

      // Generamos el token de set-password y lo guardamos en la persona: el
      // postor lo usa (vía el link del mail) para fijar su clave y habilitar el
      // login. La cuenta sigue sin contraseña hasta ese momento.
      const token = generateSetPasswordToken();
      const setPasswordExpiresAt = new Date(
        Date.now() + SET_PASSWORD_TTL_MS,
      ).toISOString();
      await context.db
        .update(people)
        .set({ setPasswordToken: token, setPasswordExpiresAt })
        .where(eq(people.id, input.personId));

      // Le avisamos que ya puede ingresar a la app y fijar su contraseña.
      if (person.email)
        await sendCategoryAssignedEmail(person.email, input.category, token);

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

  // --- Cotización / tasación de bienes (feature 1) ---

  // Bienes subidos por los usuarios que todavía no tienen cotización: existen
  // en `products` pero no tienen ninguna fila en `catalogItems`.
  pendingAppraisals: pub.handler(async ({ context }) => {
    // Anti-join (bienes sin fila en `catalogItems`): se mantiene el query
    // builder de SQL, RQB no expresa la ausencia de relación.
    const rows = await context.db
      .select({
        id: products.id,
        name: products.name,
        fullDescription: products.fullDescription,
        date: products.date,
      })
      .from(products)
      .leftJoin(catalogItems, eq(catalogItems.productId, products.id))
      .where(isNull(catalogItems.id));

    return rows;
  }),

  // Propone una cotización (precio base + comisión) para un bien. Crea el
  // catalogItem en el catálogo "holding" con estado "tasado".
  proposeQuote: pub
    .input(
      z.object({
        productId: z.number().int().positive(),
        basePrice: z.number().positive(),
        commission: z.number().positive(),
      }),
    )
    .handler(async ({ context, input }) => {
      const product = await context.db.query.products.findFirst({
        where: { id: input.productId },
        columns: { id: true },
      });
      if (!product)
        throw new ORPCError("NOT_FOUND", { message: "Bien no encontrado" });

      const already = await context.db.query.catalogItems.findFirst({
        where: { productId: input.productId },
        columns: { id: true },
      });
      if (already)
        throw new ORPCError("CONFLICT", {
          message: "El bien ya tiene una cotización",
        });

      const catalogId = await ensureHoldingCatalog(context.db);
      await context.db.insert(catalogItems).values({
        catalogId,
        productId: input.productId,
        basePrice: input.basePrice,
        commission: input.commission,
        state: "tasado",
      });

      return { success: true };
    }),

  // Cotizaciones en curso: items del catálogo holding (todavía sin agrupar en
  // un catálogo definitivo) con el nombre del bien.
  listQuotes: pub.handler(async ({ context }) => {
    const holding = await context.db.query.catalogs.findFirst({
      where: { description: HOLDING_CATALOG_DESC },
      columns: { id: true },
    });
    if (!holding) return [];

    const rows = await context.db.query.catalogItems.findMany({
      where: { catalogId: holding.id },
      columns: {
        id: true,
        basePrice: true,
        commission: true,
        state: true,
      },
      with: { product: { columns: { name: true } } },
    });

    return rows.map(({ product, ...it }) => ({
      ...it,
      productName: product?.name ?? "Bien",
    }));
  }),

  // El dueño acepta el precio base y la comisión: tasado -> aceptado. (En la
  // demo lo dispara el backoffice; en la app real lo confirmaría el usuario.)
  confirmQuote: pub
    .input(z.object({ itemId: z.number().int().positive() }))
    .handler(async ({ context, input }) => {
      const item = await context.db.query.catalogItems.findFirst({
        where: { id: input.itemId },
        columns: { id: true, state: true },
      });
      if (!item)
        throw new ORPCError("NOT_FOUND", {
          message: "Cotización no encontrada",
        });
      if (item.state !== "tasado")
        throw new ORPCError("CONFLICT", {
          message: "La cotización no está en estado tasado",
        });

      await context.db
        .update(catalogItems)
        .set({ state: "aceptado" })
        .where(eq(catalogItems.id, input.itemId));
      return { success: true };
    }),

  // El dueño rechaza el precio base / comisión: tasado -> rechazado.
  rejectQuote: pub
    .input(z.object({ itemId: z.number().int().positive() }))
    .handler(async ({ context, input }) => {
      await context.db
        .update(catalogItems)
        .set({ state: "rechazado" })
        .where(eq(catalogItems.id, input.itemId));
      return { success: true };
    }),

  // --- Armado de catálogos (feature 2) ---

  // Bienes ya cotizados y confirmados (estado "aceptado") que siguen en el
  // holding, es decir, todavía no fueron agrupados en un catálogo definitivo.
  confirmedItems: pub.handler(async ({ context }) => {
    const holding = await context.db.query.catalogs.findFirst({
      where: { description: HOLDING_CATALOG_DESC },
      columns: { id: true },
    });
    if (!holding) return [];

    const rows = await context.db.query.catalogItems.findMany({
      where: { catalogId: holding.id, state: "aceptado" },
      columns: { id: true, basePrice: true, commission: true },
      with: { product: { columns: { name: true } } },
    });

    return rows.map(({ product, ...it }) => ({
      ...it,
      productName: product?.name ?? "Bien",
    }));
  }),

  // Crea un catálogo definitivo (sin subasta todavía) y le mueve los items
  // confirmados elegidos.
  createCatalog: pub
    .input(
      z.object({
        description: z.string().trim().min(1),
        itemIds: z.array(z.number().int().positive()).min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      const managerId = await ensureDefaultEmployee(context.db);
      const [catalog] = await context.db
        .insert(catalogs)
        .values({ description: input.description, managerId })
        .returning({ id: catalogs.id });

      await context.db
        .update(catalogItems)
        .set({ catalogId: catalog.id })
        .where(
          and(
            inArray(catalogItems.id, input.itemIds),
            eq(catalogItems.state, "aceptado"),
          ),
        );

      return { success: true, catalogId: catalog.id };
    }),

  // Catálogos definitivos todavía sin subasta asignada (auctionId null y que no
  // son el holding). Listos para meter en una subasta.
  listDraftCatalogs: pub.handler(async ({ context }) => {
    const rows = await context.db.query.catalogs.findMany({
      columns: { id: true, description: true, auctionId: true },
      with: { items: { columns: { id: true } } },
    });

    return rows
      .filter(
        c => c.auctionId == null && c.description !== HOLDING_CATALOG_DESC,
      )
      .map(({ items, auctionId: _a, ...c }) => ({
        ...c,
        itemCount: items.length,
      }));
  }),

  // --- Creación de subastas (feature 3) ---

  // Subastadores disponibles para asignar (opcional).
  listAuctioneers: pub.handler(async ({ context }) => {
    const rows = await context.db.query.auctioneers.findMany({
      columns: { id: true, license: true, region: true },
      with: { person: { columns: { name: true, lastName: true } } },
    });
    return rows.map(({ person, ...a }) => ({
      ...a,
      name: [person?.name, person?.lastName].filter(Boolean).join(" ") || "—",
    }));
  }),

  // Crea una subasta (abierta) con los catálogos elegidos.
  createAuction: pub
    .input(
      z.object({
        date: z.string().trim().min(1),
        time: z.string().trim().min(1),
        category: auctionCategory,
        location: z.string().trim().optional(),
        attendeeCapacity: z.number().int().positive().optional(),
        hasWarehouse: z.boolean().optional(),
        ownSecurity: z.boolean().optional(),
        auctioneerId: z.number().int().positive().optional(),
        catalogIds: z.array(z.number().int().positive()).min(1),
      }),
    )
    .handler(async ({ context, input }) => {
      const [auction] = await context.db
        .insert(auctions)
        .values({
          date: input.date,
          time: input.time,
          category: input.category,
          status: "open",
          location: input.location,
          attendeeCapacity: input.attendeeCapacity,
          hasWarehouse: input.hasWarehouse,
          ownSecurity: input.ownSecurity,
          auctioneerId: input.auctioneerId,
        })
        .returning({ id: auctions.id });

      await context.db
        .update(catalogs)
        .set({ auctionId: auction.id })
        .where(
          and(
            inArray(catalogs.id, input.catalogIds),
            isNull(catalogs.auctionId),
          ),
        );

      return { success: true, auctionId: auction.id };
    }),

  // --- Infracciones / multas (feature 0) ---
  //
  // Emite las multas (tabla `penalties`, modelo de la PR #24: lado usuario =
  // ver/pagar en profile; acá está el lado backoffice = emitir). El estado
  // 'overdue' NO se persiste: se deriva al leer (pending && venceEl < hoy).

  // Clientes para elegir a quién aplicarle la multa.
  listClients: pub.handler(async ({ context }) => {
    const rows = await context.db.query.clients.findMany({
      columns: { id: true },
      with: { person: { columns: { name: true, lastName: true } } },
    });

    return rows.map(c => ({
      id: c.id,
      name:
        [c.person?.name, c.person?.lastName].filter(Boolean).join(" ") ||
        `Cliente #${c.id}`,
    }));
  }),

  // Subastas para (opcionalmente) atar la multa. Trae la moneda de cada una
  // (default ARS si no tiene fila en monedasSubasta) para heredarla en el form.
  listAuctionsForPenalty: pub.handler(async ({ context }) => {
    const rows = await context.db.query.auctions.findMany({
      columns: { id: true, date: true, category: true },
      with: { currencyRow: { columns: { currency: true } } },
    });

    return rows.map(a => ({
      id: a.id,
      date: a.date,
      category: a.category,
      currency: a.currencyRow?.currency ?? "ARS",
    }));
  }),

  // Emite una multa contra un cliente. Si se ata a una subasta, hereda su
  // moneda; si no, se usa la moneda elegida (default ARS). issuedAt = hoy,
  // dueDate = +3 días (72hs del enunciado). Nace en estado 'pending'.
  createPenalty: pub
    .input(
      z.object({
        clientId: z.number().int().positive(),
        reason: z.string().trim().min(1),
        amount: z.number().gt(0.01),
        currency: currency.optional(),
        auctionId: z.number().int().positive().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const client = await context.db.query.clients.findFirst({
        where: { id: input.clientId },
        columns: { id: true },
      });
      if (!client)
        throw new ORPCError("NOT_FOUND", { message: "Cliente no encontrado" });

      let penaltyCurrency = input.currency ?? "ARS";
      if (input.auctionId) {
        const auction = await context.db.query.auctions.findFirst({
          where: { id: input.auctionId },
          columns: { id: true },
          with: { currencyRow: { columns: { currency: true } } },
        });
        if (!auction)
          throw new ORPCError("NOT_FOUND", {
            message: "Subasta no encontrada",
          });
        // La multa atada a una subasta se cancela en la moneda de esa subasta.
        penaltyCurrency = auction.currencyRow?.currency ?? "ARS";
      }

      await context.db.insert(penalties).values({
        clientId: input.clientId,
        reason: input.reason,
        amount: input.amount,
        currency: penaltyCurrency,
        status: "pending",
        issuedAt: dateOffset(0),
        dueDate: dateOffset(3),
        auctionId: input.auctionId ?? null,
      });

      return { success: true };
    }),

  // Todas las multas (de todos los clientes) con el nombre del cliente y el
  // estado derivado (overdue si venció y sigue pendiente).
  listPenalties: pub.handler(async ({ context }) => {
    const rows = await context.db.query.penalties.findMany({
      orderBy: (t, { desc }) => desc(t.issuedAt),
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
      with: {
        client: {
          columns: {},
          with: { person: { columns: { name: true, lastName: true } } },
        },
      },
    });

    const now = new Date();
    return rows.map(p => ({
      id: p.id,
      reason: p.reason,
      amount: p.amount,
      currency: p.currency,
      status:
        p.status === "pending" && new Date(p.dueDate) < now
          ? ("overdue" as const)
          : p.status,
      issuedAt: toIso(p.issuedAt),
      dueDate: toIso(p.dueDate),
      auctionId: p.auctionId,
      clientName:
        [p.client?.person?.name, p.client?.person?.lastName]
          .filter(Boolean)
          .join(" ") || "Cliente",
    }));
  }),

  // Marca una multa como saldada desde el backoffice (p. ej. pago en efectivo).
  markPenaltyPaid: pub
    .input(z.object({ id: z.number().int().positive() }))
    .handler(async ({ context, input }) => {
      const penalty = await context.db.query.penalties.findFirst({
        where: { id: input.id },
        columns: { status: true },
      });
      if (!penalty)
        throw new ORPCError("NOT_FOUND", { message: "Multa no encontrada" });
      if (penalty.status === "paid")
        throw new ORPCError("CONFLICT", { message: "La multa ya está pagada" });

      await context.db
        .update(penalties)
        .set({ status: "paid" })
        .where(eq(penalties.id, input.id));
      return { success: true };
    }),
};
