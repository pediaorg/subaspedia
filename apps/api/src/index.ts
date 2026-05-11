import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { createDb } from "@/api/db";
import { AuctionRoom } from "@/api/durable-objects/auction";
import type { CookieDirective } from "@/api/lib/auth";
import { parseRefreshCookie, serializeCookie } from "@/api/lib/auth";
import { router } from "@/api/rpc";

export { AuctionRoom };

export type Env = {
  DB: D1Database;
  AUCTION_ROOM: DurableObjectNamespace<AuctionRoom>;
  JWT_SECRET: string;
  WEB_ORIGIN?: string;
};

const app = new Hono<{ Bindings: Env }>();

const rpcHandler = new RPCHandler(router);

app.use("*", (c, next) =>
  cors({
    origin: c.env.WEB_ORIGIN ?? "http://localhost:8081",
    credentials: true,
  })(c, next),
);
app.use(secureHeaders());

app.get("/", c => c.text("Subaspedia API"));

app.use("/rpc/*", async (c, next) => {
  const cookieJar: CookieDirective[] = [];

  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: {
      db: createDb(c.env.DB),
      jwtSecret: c.env.JWT_SECRET,
      authHeader: c.req.header("Authorization") ?? null,
      refreshCookie: parseRefreshCookie(c.req.header("Cookie") ?? null),
      cookieJar,
    },
  });

  if (matched) {
    const headers = new Headers(response.headers);
    for (const cookie of cookieJar) {
      headers.append("Set-Cookie", serializeCookie(cookie));
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  await next();
});

app.get("/auctions/:id/ws", c => c.text("TODO", 501));

export default app;
