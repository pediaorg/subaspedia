import { newProductSchema } from "@subaspedia/types/forms";
import { type ProductStatus, productSchema } from "@subaspedia/types/product";
import { z } from "zod";

import { type Context, authed } from "../context";
import { employees, owners, people, photos, products } from "../db/schema";

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

// catalog_items.state guarda el estado en español (lo que escribe el back); el
// front consume el enum ProductStatus en inglés. Un producto recién subido aún
// no tiene catalog_item -> lo tratamos como "under_review" (en tasación).
const STATE_TO_STATUS = {
  "en revisión": "under_review",
  tasado: "appraised",
  aceptado: "approved",
  rechazado: "rejected",
  subastado: "auctioned",
} as const satisfies Record<string, ProductStatus>;

// Primera foto del producto como data URI base64 (mismo criterio que el avatar
// en users.ts: la columna es BLOB, el MIME se infiere de los magic bytes). Si
// el producto no tiene fotos, caemos a un placeholder (img es no-nullable en el
// schema del front). A futuro: thumbnail en R2 y devolver URL en vez de base64.
function firstPhotoToImg(
  photo: Buffer | null | undefined,
  productId: number,
): string {
  if (!photo || photo.length === 0)
    return `https://picsum.photos/seed/product-${productId}/200`;
  const mime =
    photo[0] === 0x89
      ? "image/png"
      : photo[0] === 0x47
        ? "image/gif"
        : "image/jpeg"; // JPEG (0xFF) y fallback
  return `data:${mime};base64,${Buffer.from(photo).toString("base64")}`;
}

// SQLite guarda fechas como "YYYY-MM-DD" o "YYYY-MM-DD HH:MM:SS" (sin T ni Z);
// z.iso.datetime() del productSchema las rechaza -> normalizamos a ISO.
function toIso(value: string): string {
  if (value.includes("T")) return new Date(value).toISOString();
  const withT = value.includes(" ")
    ? value.replace(" ", "T")
    : `${value}T00:00:00`;
  return new Date(`${withT}Z`).toISOString();
}

export const productsRouter = {
  // GET /products — Mis productos (solo los del owner logueado) con su estado.
  // La propuesta/tasación (proposalText/proposedBasePrice/proposedCommission)
  // se implementa más adelante -> por ahora va en null.
  list: authed.output(z.array(productSchema)).handler(async ({ context }) => {
    const rows = await context.db.query.products.findMany({
      where: { ownerId: context.userId },
      with: {
        photos: { columns: { photo: true } },
        catalogItems: {
          columns: { state: true },
          with: { catalog: { columns: { auctionId: true } } },
        },
        auctionRecords: {
          columns: { amount: true },
          with: { auction: { columns: { date: true } } },
        },
      },
    });

    return rows.map(p => {
      // Normalmente hay 1 catalog_item / 1 record por producto; si hubiera
      // varios tomamos el último (el estado/venta más reciente).
      const item = p.catalogItems.at(-1);
      const record = p.auctionRecords.at(-1);
      return {
        id: p.id,
        name: p.name,
        status: item?.state ? STATE_TO_STATUS[item.state] : "under_review",
        img: firstPhotoToImg(p.photos[0]?.photo, p.id),
        // Propuesta: pendiente (ver proposal.tsx / GET /products/{id}).
        proposalText: null,
        proposedBasePrice: null,
        proposedCommission: null,
        // Venta: poblado solo si el bien ya se remató (auction_records).
        salePrice: record?.amount ?? null,
        saleDate: record?.auction?.date ? toIso(record.auction.date) : null,
        auctionId: item?.catalog?.auctionId ?? null,
      };
    });
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

    return { success: true, id: created.id };
  }),
};
