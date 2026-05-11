import { ORPCError } from "@orpc/server";
import { sign } from "hono/jwt";

import { pub, refreshed } from "@/api/context";
import { users } from "@/api/db/schema";
import {
  ACCESS_TTL,
  credentials,
  hashPassword,
  issueTokens,
  verifyPassword,
} from "@/api/lib/auth";

export const authRouter = {
  register: pub.input(credentials).handler(async ({ context, input }) => {
    const existing = await context.db.query.users.findFirst({
      where: { email: input.email },
    });

    if (existing)
      throw new ORPCError("CONFLICT", {
        message: "Email ya registrado",
      });

    const passwordHash = await hashPassword(input.password);
    const [created] = await context.db
      .insert(users)
      .values({ email: input.email, passwordHash })
      .returning({ id: users.id });

    return issueTokens(created.id, context.jwtSecret);
  }),

  login: pub.input(credentials).handler(async ({ context, input }) => {
    const user = await context.db.query.users.findFirst({
      where: { email: input.email },
    });

    if (!user)
      throw new ORPCError("UNAUTHORIZED", {
        message: "Usuario no encontrado",
      });

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid)
      throw new ORPCError("UNAUTHORIZED", {
        message: "Credenciales inválidas",
      });

    return issueTokens(user.id, context.jwtSecret);
  }),

  refresh: refreshed.handler(async ({ context }) => {
    const now = Math.floor(Date.now() / 1000);
    const accessToken = await sign(
      { sub: context.userId, type: "access", iat: now, exp: now + ACCESS_TTL },
      context.jwtSecret,
    );

    return { accessToken };
  }),
};
