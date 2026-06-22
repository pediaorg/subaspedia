import { ORPCError } from "@orpc/server";
import { newProductSchema } from "@subaspedia/types/forms";
import { type ProductStatus, productSchema } from "@subaspedia/types/product";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { type Context, authed } from "../context";
import {
  catalogItems,
  employees,
  owners,
  people,
  photos,
  products,
  quotes,
} from "../db/schema";
import { toIso } from "../lib/date";
import { firstPhotoToImg } from "../lib/photo";

// owners.verifierId es NOT NULL (employees.id). En la demo no hay empleados
// reales: garantizamos uno por defecto. Mismo patrón que backoffice.ts.
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

// El user logueado es una `people`, no necesariamente un `owner`. Lo
// materializamos en su primer upload para poder linkear el producto.
async function ensureOwner(db: Context["db"], userId: number): Promise<number> {
  const existing = await db.query.owners.findFirst({
    where: { id: userId },
    columns: { id: true },
  });
  if (existing) return existing.id;

  const verifierId = await ensureDefaultEmployee(db);
  await db.insert(owners).values({ id: userId, verifierId });
  return userId;
}

// El status de "Mis productos" se deriva del estado de la COTIZACIÓN del bien
// (tabla `cotizaciones`). El enum español es lo que persiste el back; el front
// consume ProductStatus en inglés. Un producto sin cotización (no debería pasar
// con el flujo nuevo, que la crea al subir) cae a "under_review". El estado
// "auctioned" ya no sale de acá: pertenece a la venta (registroDeSubasta) y se
// derivará por separado cuando se cierre ese flujo.
const QUOTE_STATE_TO_STATUS = {
  "en revisión": "under_review",
  tasado: "appraised",
  aceptado: "approved",
  rechazado: "rejected",
} as const satisfies Record<string, ProductStatus>;

// El front manda el estado en inglés (approved/rejected); la cotización guarda
// el español.
const STATUS_TO_QUOTE_STATE = {
  approved: "aceptado",
  rejected: "rechazado",
} as const;

// Relaciones que necesita el mapeo a `Product` (compartidas por list y getById).
type ProductRow = {
  id: number;
  name: string;
  photos: { id: number }[];
  quote: {
    state: "en revisión" | "tasado" | "aceptado" | "rechazado";
    message: string | null;
    basePrice: number | null;
    commission: number | null;
  } | null;
  catalogItems: { catalog: { auctionId: number | null } | null }[];
  auctionRecords: {
    amount: number;
    auction: {
      id: number;
      date: string | null;
      currencyRow: { currency: "ARS" | "USD" } | null;
    } | null;
  }[];
};

// Arma el `Product` que consume el front a partir de la row + sus relaciones.
function toProduct(
  p: ProductRow,
  apiOrigin: string,
): z.infer<typeof productSchema> {
  // Normalmente hay 1 catalog_item / 1 record por producto; si hubiera varios
  // tomamos el último (el estado/venta más reciente).
  const item = p.catalogItems.at(-1);
  const record = p.auctionRecords.at(-1);
  const quote = p.quote;
  return {
    id: p.id,
    name: p.name,
    // El status tiene DOS fuentes y la venta tiene precedencia: si el bien ya
    // se remató (tiene registroDeSubasta) es "auctioned", aunque su cotización
    // quedó en 'aceptado'. Sin venta, se deriva de la cotización (o
    // "under_review" si todavía no tiene). Es la única vía que produce
    // "auctioned": el enum lo define pero QUOTE_STATE_TO_STATUS no lo mapea.
    status: record
      ? "auctioned"
      : quote
        ? QUOTE_STATE_TO_STATUS[quote.state]
        : "under_review",
    img: firstPhotoToImg(p.photos[0]?.id, apiOrigin, p.id),
    // Propuesta/tasación: sale de la cotización (null mientras está "en revisión").
    proposalText: quote?.message ?? null,
    proposedBasePrice: quote?.basePrice ?? null,
    proposedCommission: quote?.commission ?? null,
    // Venta: poblado solo si el bien ya se remató (auction_records).
    salePrice: record?.amount ?? null,
    // Moneda de la venta: la de la subasta donde se remató (default ARS si no
    // tiene fila en monedasSubasta). Null si el bien no se vendió.
    currency: record ? (record.auction?.currencyRow?.currency ?? "ARS") : null,
    saleDate: record?.auction?.date ? toIso(record.auction.date) : null,
    // ¿A qué subasta linkea "Ver subasta"? Para un bien vendido, la fuente
    // correcta es la subasta de la VENTA (registroDeSubasta), no la del catálogo
    // del catalogItem (pueden divergir si el item se re-catalogó). Para un bien
    // aprobado sin venta caemos al catálogo.
    auctionId: record?.auction?.id ?? item?.catalog?.auctionId ?? null,
  };
}

const PRODUCT_WITH = {
  photos: { columns: { id: true } },
  quote: {
    columns: { state: true, message: true, basePrice: true, commission: true },
  },
  catalogItems: {
    columns: { id: true },
    with: { catalog: { columns: { auctionId: true } } },
  },
  auctionRecords: {
    columns: { amount: true },
    with: {
      auction: {
        columns: { id: true, date: true },
        with: { currencyRow: true },
      },
    },
  },
} as const;

export const productsRouter = {
  // GET /products — Mis productos (solo los del owner logueado) con su estado.
  list: authed.output(z.array(productSchema)).handler(async ({ context }) => {
    const rows = await context.db.query.products.findMany({
      where: { ownerId: context.userId },
      with: PRODUCT_WITH,
    });
    return rows.map(p => toProduct(p, context.apiOrigin));
  }),

  // GET /products/{id} — Detalle de un producto propio y su cotización.
  getById: authed
    .input(z.object({ id: z.number().int().positive() }))
    .output(productSchema)
    .handler(async ({ context, input }) => {
      const row = await context.db.query.products.findFirst({
        // Ownership: solo el dueño puede ver el detalle de su bien.
        where: { id: input.id, ownerId: context.userId },
        with: PRODUCT_WITH,
      });
      if (!row)
        throw new ORPCError("NOT_FOUND", { message: "Producto no encontrado" });
      return toProduct(row, context.apiOrigin);
    }),

  // PUT /products/{id}/status — El dueño acepta/rechaza la cotización tasada.
  // tasado -> aceptado/rechazado. (El admin solo sugiere, vía backoffice.)
  updateStatus: authed
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["approved", "rejected"]),
      }),
    )
    .output(z.object({ success: z.boolean() }))
    .handler(async ({ context, input }) => {
      const product = await context.db.query.products.findFirst({
        where: { id: input.id, ownerId: context.userId },
        columns: { id: true },
        with: { quote: { columns: { id: true, state: true } } },
      });
      if (!product?.quote)
        throw new ORPCError("NOT_FOUND", {
          message: "Cotización no encontrada",
        });
      if (product.quote.state !== "tasado")
        throw new ORPCError("CONFLICT", {
          message: "La cotización no está pendiente de aceptación",
        });

      await context.db
        .update(quotes)
        .set({ state: STATUS_TO_QUOTE_STATE[input.status] })
        .where(eq(quotes.id, product.quote.id));

      // Si el dueño rechaza, el catalogItem que se creó al tasar (en el holding)
      // queda huérfano: lo borramos para no dejar basura. Un bien rechazado
      // nunca llegó a un catálogo definitivo, así que su único catalogItem es el
      // del holding.
      if (input.status === "rejected")
        await context.db
          .delete(catalogItems)
          .where(eq(catalogItems.productId, input.id));

      return { success: true };
    }),

  create: authed.input(newProductSchema).handler(async ({ context, input }) => {
    const ownerId = await ensureOwner(context.db, context.userId);

    const [created] = await context.db
      .insert(products)
      .values({
        name: input.name,
        fullDescription: input.description ?? "",
        catalogDescription: input.interest || "None",
        available: false,
        ownerId,
      })
      .returning({ id: products.id });

    await context.db.insert(photos).values(
      input.images.map(image => ({
        productId: created.id,
        photo: Buffer.from(image, "base64"),
      })),
    );

    // La cotización nace al subir el bien, en "en revisión" (sin precio/comisión/
    // mensaje): así el dueño ve en "Mis productos" que está a la espera de que la
    // empresa lo evalúe. El backoffice la pasa a tasado/rechazado.
    await context.db.insert(quotes).values({
      productId: created.id,
      state: "en revisión",
    });

    return { success: true, id: created.id };
  }),
};
