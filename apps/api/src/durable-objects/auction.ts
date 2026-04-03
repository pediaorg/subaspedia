import { DurableObject } from "cloudflare:workers";

export class AuctionRoom extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    return new Response("TODO", { status: 501 });
  }
}
