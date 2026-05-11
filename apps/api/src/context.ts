import { ORPCError, os } from "@orpc/server";
import { verify } from "hono/jwt";

import type { createDb } from "@/api/db";
import {
  BEARER_TOKEN,
  JWT_PAYLOAD,
  type JWTPayload,
} from "@/api/lib/auth/types";

export type Context = {
  db: ReturnType<typeof createDb>;
  jwtSecret: string;
  authHeader: string | null;
};

export const pub = os.$context<Context>();

function requireJwt(expectedType: JWTPayload["type"] = "access") {
  return pub.use(async ({ context, next }) => {
    const token = BEARER_TOKEN.safeParse(context.authHeader);

    if (token.error)
      throw new ORPCError("UNAUTHORIZED", { message: "Token requerido" });

    const payload = await verify(token.data, context.jwtSecret, "HS256")
      .catch(() => null)
      .then(JWT_PAYLOAD.safeParse);

    if (payload.error || payload.data.type !== expectedType)
      throw new ORPCError("UNAUTHORIZED", { message: "Token inválido" });

    return next({ context: { userId: payload.data.sub } });
  });
}

export const authed = requireJwt("access");
export const refreshed = requireJwt("refresh");
