import type { DurableObjectState } from "@cloudflare/workers-types";

export class AuctionRoom implements DurableObject {
  constructor(private state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    return new Response("TODO", { status: 501 });
  }
}
