export class AuctionRoom implements DurableObject {
  readonly [Rpc.__DURABLE_OBJECT_BRAND] = undefined as never;

  async fetch(request: Request): Promise<Response> {
    return new Response("TODO", { status: 501 });
  }
}
