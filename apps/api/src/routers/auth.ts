import { ORPCError } from "@orpc/server";

import { authed, type Context, pub, refreshed } from "@/api/context";
import { users } from "@/api/db/schema";
import {
  REFRESH_COOKIE,
  REFRESH_TTL,
  credentials,
  hashPassword,
  issueAccessToken,
  issueTokens,
  verifyPassword,
} from "@/api/lib/auth";

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
    const existing = await context.db.query.users.findFirst({
      where: { email: input.email },
    });

    if (existing)
      throw new ORPCError("CONFLICT", { message: "Email ya registrado" });

    const passwordHash = await hashPassword(input.password);
    const [created] = await context.db
      .insert(users)
      .values({ email: input.email, passwordHash })
      .returning({ id: users.id });

    const tokens = await issueTokens(created.id, context.jwtSecret);
    return deliverTokens(context, tokens);
  }),

  login: pub.input(credentials).handler(async ({ context, input }) => {
    const user = await context.db.query.users.findFirst({
      where: { email: input.email },
    });

    if (!user)
      throw new ORPCError("UNAUTHORIZED", { message: "Usuario no encontrado" });

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid)
      throw new ORPCError("UNAUTHORIZED", {
        message: "Credenciales inválidas",
      });

    const tokens = await issueTokens(user.id, context.jwtSecret);
    return deliverTokens(context, tokens);
  }),

  refresh: refreshed.handler(async ({ context }) => {
    const accessToken = await issueAccessToken(
      context.userId,
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
