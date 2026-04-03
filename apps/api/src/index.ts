import { Hono } from "hono";

import { AuctionRoom } from "./durable-objects/auction";

export { AuctionRoom };

export type Env = {
  DB: D1Database;
  AUCTION_ROOM: DurableObjectNamespace<AuctionRoom>;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/", c => c.text("Subaspedia API"));

app.get("/auctions/:id/ws", c => c.text("TODO", 501));

export default app;
