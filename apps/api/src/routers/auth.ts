import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";

import {
  registerStep1Schema,
  setPasswordSchema,
  verifyCodeSchema,
} from "@subaspedia/types/forms/auth";
import { authed, type Context, pub, refreshed } from "@/api/context";
import { emailVerifications, people } from "@/api/db/schema";
import {
  type AccessClaims,
  credentials,
  hashPassword,
  issueAccessToken,
  issueTokens,
  REFRESH_COOKIE,
  REFRESH_TTL,
  verifyPassword,
} from "@/api/lib/auth";
import {
  generateVerificationCode,
  sendVerificationEmail,
} from "@/api/lib/email";

// El código de verificación vence a los 15 minutos de generado.
const VERIFICATION_TTL_MS = 15 * 60 * 1000;

// Convierte un data URI base64 (data:image/...;base64,XXXX) en bytes para
// guardarlo en una columna blob. Devuelve null si no hay imagen.
function decodeDataUri(value: string | null): Buffer | null {
  if (!value) return null;
  const comma = value.indexOf(",");
  const b64 = comma >= 0 ? value.slice(comma + 1) : value;
  return Buffer.from(b64, "base64");
}

async function resolveClaims(
  db: Context["db"],
  userId: number,
): Promise<AccessClaims> {
  // userId es people.id, que coincide con clients.id (los clients cuelgan de
  // people). Si la persona no es un client, no tiene categoría.
  const client = await db.query.clients.findFirst({
    where: { id: userId },
    columns: { category: true },
    with: {
      // Solo puede pujar si tiene al menos un medio de pago verificado.
      paymentMethods: {
        where: { verified: true },
        columns: { id: true },
        limit: 1,
      },
    },
  });

  return {
    category: client?.category ?? null,
    hasVerifiedPaymentMethod: Boolean(client?.paymentMethods.length),
  };
}

function deliverTokens(
  context: Context,
  tokens: { accessToken: string; refreshToken: string },
) {
  if (context.clientType === "native") {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
  context.cookieJar.push({
    name: REFRESH_COOKIE,
    value: tokens.refreshToken,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: REFRESH_TTL,
      path: "/",
    },
  });
  return { accessToken: tokens.accessToken, refreshToken: undefined };
}

export const authRouter = {
  // Registro etapa 1: el postor carga sus datos. Guardamos un pre-registro y
  // le mandamos un código por email. Todavía no existe como `people`.
  register: pub
    .input(registerStep1Schema)
    .handler(async ({ context, input }) => {
      const existing = await context.db.query.people.findFirst({
        where: { email: input.email },
        columns: { id: true },
      });
      if (existing)
        throw new ORPCError("CONFLICT", { message: "Email ya registrado" });

      const code = generateVerificationCode();
      const expiresAt = new Date(
        Date.now() + VERIFICATION_TTL_MS,
      ).toISOString();

      // Reemplazamos cualquier pre-registro previo del mismo email (reenvío).
      await context.db
        .delete(emailVerifications)
        .where(eq(emailVerifications.email, input.email));
      await context.db.insert(emailVerifications).values({
        email: input.email,
        code,
        name: input.name,
        lastName: input.lastName,
        address: input.legalAddress,
        country: input.country,
        document: input.document,
        dniFront: input.dniFront,
        dniBack: input.dniBack,
        verified: false,
        expiresAt,
      });

      await sendVerificationEmail(input.email, code);

      return { email: input.email };
    }),

  // Registro etapa 2a: valida el código y materializa la cuenta SIN contraseña.
  // La persona queda "pendiente": existe en `people` con sus datos y documento,
  // pero no puede loguear hasta que la empresa la apruebe (asigne categoría) y
  // fije su clave vía el link de set-password.
  verifyCode: pub
    .input(verifyCodeSchema)
    .handler(async ({ context, input }) => {
      const pending = await context.db.query.emailVerifications.findFirst({
        where: { email: input.email },
      });

      if (!pending || pending.code !== input.code)
        throw new ORPCError("UNAUTHORIZED", { message: "Código inválido" });
      if (new Date(pending.expiresAt).getTime() < Date.now())
        throw new ORPCError("UNAUTHORIZED", { message: "Código vencido" });

      await context.db
        .update(emailVerifications)
        .set({ verified: true })
        .where(eq(emailVerifications.email, input.email));

      // Si ya se materializó la cuenta (reintento de verificación), no duplicar.
      const already = await context.db.query.people.findFirst({
        where: { email: input.email },
        columns: { id: true },
      });
      if (!already) {
        await context.db.insert(people).values({
          name: pending.name,
          lastName: pending.lastName,
          address: pending.address,
          document: pending.document,
          status: "active",
          email: pending.email,
          // Guardamos el frente del documento (base64) como foto de la persona.
          photo: decodeDataUri(pending.dniFront),
        });
      }

      // No borramos el pre-registro: queda como dossier de KYC (datos + fotos
      // frente/dorso del documento) que la empresa revisa para asignar la
      // categoría.
      return { success: true };
    }),

  // Set-password: el postor aprobado por la empresa fija su clave usando el
  // token de un solo uso que recibió por mail. Recién acá la cuenta queda
  // habilitada para loguear.
  setPassword: pub
    .input(setPasswordSchema)
    .handler(async ({ context, input }) => {
      const person = await context.db.query.people.findFirst({
        where: { setPasswordToken: input.token },
        columns: { id: true, setPasswordExpiresAt: true },
      });

      if (!person)
        throw new ORPCError("UNAUTHORIZED", { message: "Token inválido" });
      if (
        !person.setPasswordExpiresAt ||
        new Date(person.setPasswordExpiresAt).getTime() < Date.now()
      )
        throw new ORPCError("UNAUTHORIZED", { message: "Token vencido" });

      const passwordHash = await hashPassword(input.password);
      await context.db
        .update(people)
        .set({
          passwordHash,
          setPasswordToken: null,
          setPasswordExpiresAt: null,
        })
        .where(eq(people.id, person.id));

      const claims = await resolveClaims(context.db, person.id);
      const tokens = await issueTokens(person.id, claims, context.jwtSecret);
      return deliverTokens(context, tokens);
    }),

  login: pub.input(credentials).handler(async ({ context, input }) => {
    const user = await context.db.query.people.findFirst({
      where: { email: input.email },
    });

    if (!user || !user.passwordHash)
      throw new ORPCError("UNAUTHORIZED", { message: "Usuario no encontrado" });

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid)
      throw new ORPCError("UNAUTHORIZED", {
        message: "Credenciales inválidas",
      });

    const claims = await resolveClaims(context.db, user.id);
    const tokens = await issueTokens(user.id, claims, context.jwtSecret);
    return deliverTokens(context, tokens);
  }),

  refresh: refreshed.handler(async ({ context }) => {
    const claims = await resolveClaims(context.db, context.userId);
    const accessToken = await issueAccessToken(
      context.userId,
      claims,
      context.jwtSecret,
    );
    return { accessToken };
  }),

  logout: authed.handler(async ({ context }) => {
    context.cookieJar.push({
      name: REFRESH_COOKIE,
      value: "",
      options: {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 0,
        path: "/",
      },
    });
    return { success: true };
  }),
};
