import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { verify } from "hono/jwt";
import { secureHeaders } from "hono/secure-headers";

import { createDb } from "@/api/db";
import { photos } from "@/api/db/schema";
import { dbExplorer } from "@/api/db-explorer";
import { AuctionRoom } from "@/api/durable-objects/auction";
import type { CookieDirective } from "@/api/lib/auth";
import {
  JWT_PAYLOAD,
  parseRefreshCookie,
  serializeCookie,
} from "@/api/lib/auth";
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

app.use("*", (c, next) => {
  // Orígenes permitidos: el configurado (WEB_ORIGIN) + los de desarrollo de
  // Expo (web en :8081, Metro/Expo Go en :8082). Con credentials:true no se
  // puede usar "*", así que reflejamos el origin solo si está en la lista. En
  // native (device) fetch no aplica CORS, por eso solo importa para la web.
  const allowed = [
    c.env.WEB_ORIGIN,
    "http://localhost:8081",
    "http://localhost:8082",
  ].filter(Boolean) as string[];
  return cors({
    origin: origin => (allowed.includes(origin) ? origin : null),
    credentials: true,
  })(c, next);
});
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
        apiOrigin: new URL(c.req.url).origin,
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

// WebSocket de subasta en vivo: canal único de pujas y de difusión en tiempo
// real (puja actual, quién la tiene, tiempo restante). El postor se autentica
// con `?token=<accessToken>` (los WebSockets del navegador no pueden mandar
// headers): si el token es válido, inyectamos su id como header interno hacia el
// DO; sin token la conexión es de solo lectura (espectador). Reenvía el upgrade
// a la instancia del Durable Object de la subasta.
app.get("/auctions/:id/ws", async c => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) return c.text("Invalid id", 400);

  if (c.req.header("Upgrade") !== "websocket")
    return c.text("Expected websocket", 426);

  const headers = new Headers(c.req.raw.headers);
  headers.set("X-Auction-Id", String(id));

  const token = new URL(c.req.url).searchParams.get("token");
  if (token) {
    const payload = await verify(token, c.env.JWT_SECRET, "HS256")
      .catch(() => null)
      .then(JWT_PAYLOAD.safeParse);
    if (payload.success && payload.data.type === "access")
      headers.set("X-User-Id", String(payload.data.sub));
  }

  const stub = c.env.AUCTION_ROOM.get(
    c.env.AUCTION_ROOM.idFromName(`auction:${id}`),
  );

  return stub.fetch(new Request(c.req.url, { method: "GET", headers }));
});

export default app;
