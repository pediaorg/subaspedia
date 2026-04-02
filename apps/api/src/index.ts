import { Hono } from "hono";

export { AuctionRoom } from "./durable-objects/auction";

export type Env = Record<string, unknown>;

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.text("Subaspedia API"));

app.get("/auctions/:id/ws", (c) => c.text("TODO", 501));

export default app;
