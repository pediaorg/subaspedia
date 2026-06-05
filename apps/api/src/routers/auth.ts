import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";

import {
  completeRegistrationSchema,
  registerStep1Schema,
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
        dniFront: input.dniFront,
        dniBack: input.dniBack,
        verified: false,
        expiresAt,
      });

      await sendVerificationEmail(input.email, code);

      return { email: input.email };
    }),

  // Registro etapa 2a: valida el código recibido por email.
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

      return { success: true };
    }),

  // Registro etapa 2b: crea la clave personal y materializa la cuenta. La
  // categoría queda sin asignar (la define la empresa luego de investigar).
  completeRegistration: pub
    .input(completeRegistrationSchema)
    .handler(async ({ context, input }) => {
      const pending = await context.db.query.emailVerifications.findFirst({
        where: { email: input.email },
      });

      if (!pending || pending.code !== input.code)
        throw new ORPCError("UNAUTHORIZED", { message: "Código inválido" });
      if (!pending.verified)
        throw new ORPCError("FORBIDDEN", {
          message: "Verificá el código primero",
        });
      if (new Date(pending.expiresAt).getTime() < Date.now())
        throw new ORPCError("UNAUTHORIZED", { message: "Código vencido" });

      // Evita completar dos veces el registro del mismo email.
      const already = await context.db.query.people.findFirst({
        where: { email: input.email },
        columns: { id: true },
      });
      if (already)
        throw new ORPCError("CONFLICT", { message: "Email ya registrado" });

      const passwordHash = await hashPassword(input.password);
      const [created] = await context.db
        .insert(people)
        .values({
          name: pending.name,
          lastName: pending.lastName,
          address: pending.address,
          status: "active",
          email: pending.email,
          // El avatar arranca en default (photo NULL); el usuario lo actualiza
          // desde el perfil. El DNI (frente/dorso) queda en el dossier de KYC
          // (email_verifications), no como foto de perfil.
          passwordHash,
        })
        .returning({ id: people.id });

      // No borramos el pre-registro: queda como dossier de KYC (datos + fotos
      // frente/dorso del documento) que la empresa revisa para asignar la
      // categoría. Invalidamos el código para que no se reutilice.
      await context.db
        .update(emailVerifications)
        .set({ code: "" })
        .where(eq(emailVerifications.email, input.email));

      const claims = await resolveClaims(context.db, created.id);
      const tokens = await issueTokens(created.id, claims, context.jwtSecret);
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
