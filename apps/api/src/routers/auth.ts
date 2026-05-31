import { ORPCError } from "@orpc/server";

import { authed, type Context, pub, refreshed } from "@/api/context";
import { people } from "@/api/db/schema";
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
  register: pub.input(credentials).handler(async ({ context, input }) => {
    const existing = await context.db.query.people.findFirst({
      where: { email: input.email },
    });

    if (existing)
      throw new ORPCError("CONFLICT", { message: "Email ya registrado" });

    const passwordHash = await hashPassword(input.password);
    const [created] = await context.db
      .insert(people)
      .values({ email: input.email, passwordHash })
      .returning({ id: people.id });

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
