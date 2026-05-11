export const AUCTION_DO_BINDING = "AUCTION_ROOM";
export const AUCTION_DO_CLASS = "AuctionRoom";

export function auctionDurableObject(
  workerArgs: cloudflare.WorkersScriptArgs,
): void {
  workerArgs.migrations = {
    steps: [{ newSqliteClasses: [AUCTION_DO_CLASS] }],
  };
  workerArgs.bindings = $output(workerArgs.bindings).apply(existing => [
    ...(existing ?? []),
    {
      type: "durable_object_namespace",
      name: AUCTION_DO_BINDING,
      className: AUCTION_DO_CLASS,
    },
  ]);
}
