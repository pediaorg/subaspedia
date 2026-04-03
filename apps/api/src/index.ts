import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";

import { createDb } from "./db";
import { AuctionRoom } from "./durable-objects/auction";
import { router } from "./rpc";

export { AuctionRoom };

export type Env = {
  DB: D1Database;
  AUCTION_ROOM: DurableObjectNamespace<AuctionRoom>;
};

const app = new Hono<{ Bindings: Env }>();

const rpcHandler = new RPCHandler(router);

app.get("/", c => c.text("Subaspedia API"));

app.use("/rpc/*", async (c, next) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: {
      db: createDb(c.env.DB),
    },
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

app.get("/auctions/:id/ws", c => c.text("TODO", 501));

export default app;
