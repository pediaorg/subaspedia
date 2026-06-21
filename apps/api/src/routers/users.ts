import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";

import { updateProfileInputSchema, userSchema } from "@subaspedia/types/user";
import { type Context, authed } from "@/api/context";
import { clients, people } from "@/api/db/schema";
import { toIso } from "@/api/lib/date";

// La foto de perfil vive como BLOB en `people.photo`. Para la entrega la
// servimos inline como data URI (base64) en avatarUrl; el `<Image>` del front
// la renderiza directo. El MIME lo inferimos de los magic bytes (la columna
// guarda bytes crudos, perdió el tipo original). A futuro: mover a R2 y
// devolver una URL en vez del base64 (no infla el payload de /users/me).
function photoToDataUri(photo: Buffer | null): string | null {
  if (!photo || photo.length === 0) return null;
  const mime =
    photo[0] === 0x89
      ? "image/png"
      : photo[0] === 0x47
        ? "image/gif"
        : "image/jpeg"; // JPEG (0xFF) y fallback
  return `data:${mime};base64,${Buffer.from(photo).toString("base64")}`;
}

// Inverso de photoToDataUri: de un data URI base64 a bytes para guardar en el
// BLOB. Solo decodifica data URIs (lo que manda el front al elegir una foto);
// para cualquier otra cosa devuelve null (se interpreta como "sin foto").
function dataUriToBuffer(value: string): Buffer | null {
  if (!value.startsWith("data:")) return null;
  const comma = value.indexOf(",");
  return comma >= 0 ? Buffer.from(value.slice(comma + 1), "base64") : null;
}

// Trae la persona logueada y la mapea al tipo `User` del front. Centralizado
// para que `me` y `update` devuelvan exactamente el mismo shape.
async function fetchUser(db: Context["db"], userId: number) {
  const me = await db.query.people.findFirst({
    where: { id: userId },
    columns: { passwordHash: false },
    with: { client: { with: { country: true } } },
  });
  // Si no tiene email no es un usuario logueable (no debería pasar viniendo de
  // `authed`); el guard además le saca el null al tipo de me.email.
  if (!me?.email)
    throw new ORPCError("NOT_FOUND", { message: "Usuario no encontrado" });

  const client = me.client;
  const country = client?.country
    ? { id: client.country.id, name: client.country.name }
    : null;

  return {
    id: me.id,
    email: me.email,
    name: me.name ?? null,
    surname: me.lastName ?? null,
    documentId: me.document ?? null,
    address: me.address ?? null,
    country,
    category: client?.category ?? null,
    avatarUrl: photoToDataUri(me.photo),
    admitted: client?.admitted ?? false,
    createdAt: toIso(me.createdAt),
  };
}

export const usersRouter = {
  me: authed.output(userSchema).handler(async ({ context }) => {
    return fetchUser(context.db, context.userId);
  }),

  update: authed
    .input(updateProfileInputSchema)
    .output(userSchema)
    .handler(async ({ context, input }) => {
      const userId = context.userId;

      // Email es único: si lo cambia, que no choque con otra persona.
      if (input.email) {
        const existing = await context.db.query.people.findFirst({
          where: { email: input.email },
          columns: { id: true },
        });
        if (existing && existing.id !== userId)
          throw new ORPCError("CONFLICT", { message: "Email ya registrado" });
      }

      // --- people (datos personales) ---
      // Solo seteamos las keys presentes en el input (PATCH parcial). El front
      // ya manda únicamente lo que cambió.
      const patch: Partial<typeof people.$inferInsert> = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.surname !== undefined) patch.lastName = input.surname;
      if (input.documentId !== undefined) patch.document = input.documentId;
      if (input.address !== undefined) patch.address = input.address;
      if (input.email !== undefined) patch.email = input.email;
      if (input.avatarUrl !== undefined)
        patch.photo =
          input.avatarUrl === null ? null : dataUriToBuffer(input.avatarUrl);

      if (Object.keys(patch).length > 0)
        await context.db.update(people).set(patch).where(eq(people.id, userId));

      // --- clients (país) ---
      // El país vive en clients.country_id; si la persona no es client, el
      // update afecta 0 filas y no rompe nada.
      if (input.country !== undefined)
        await context.db
          .update(clients)
          .set({ countryId: input.country?.id ?? null })
          .where(eq(clients.id, userId));

      return fetchUser(context.db, userId);
    }),
};
