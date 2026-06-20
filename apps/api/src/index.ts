import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { createDb } from "@/api/db";
import { photos } from "@/api/db/schema";
import { dbExplorer } from "@/api/db-explorer";
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

const rpcHandler = new RPCHandler(router, {
  interceptors: [
    onError(error => {
      if (error instanceof ORPCError) return;
      console.error("oRPC unhandled error:", {
        name: (error as Error)?.name,
        message: (error as Error)?.message,
        stack: (error as Error)?.stack,
        cause: (error as { cause?: unknown })?.cause,
      });
    }),
  ],
});

app.use("*", (c, next) =>
  cors({
    origin: c.env.WEB_ORIGIN ?? "http://localhost:8081",
    credentials: true,
  })(c, next),
);
app.use(secureHeaders({ crossOriginResourcePolicy: "cross-origin" }));

app.get("/", c => c.text("Subaspedia API"));

app.route("/db", dbExplorer());

app.get("/photo/:id", async c => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.text("Invalid id", 400);
  }

  const row = await createDb(c.env.DB).query.photos.findFirst({
    where: { id },
    columns: { photo: true },
  });

  if (!row) return c.text("Not found", 404);

  return new Response(row.photo, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

app.use("/rpc/*", async (c, next) => {
  const cookieJar: CookieDirective[] = [];

  try {
    const { matched, response } = await rpcHandler.handle(c.req.raw, {
      prefix: "/rpc",
      context: {
        db: createDb(c.env.DB),
        jwtSecret: c.env.JWT_SECRET,
        authHeader: c.req.header("Authorization") ?? null,
        refreshCookie: parseRefreshCookie(c.req.header("Cookie") ?? null),
        refreshHeader: c.req.header("X-Refresh-Token") ?? null,
        clientType: c.req.header("X-Client") === "native" ? "native" : "web",
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
  } catch (err) {
    console.error("RPC handler threw:", err);
    throw err;
  }

  await next();
});

app.onError((err, c) => {
  console.error("Hono onError:", {
    message: err.message,
    stack: err.stack,
    name: err.name,
    cause: (err as { cause?: unknown }).cause,
  });
  return c.json({ error: "Internal", message: err.message }, { status: 500 });
});

app.get("/auctions/:id/ws", c => c.text("TODO", 501));

export default app;
