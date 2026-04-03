import type { RouterClient } from "@orpc/server";
import { os } from "@orpc/server";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

export type Context = {
  db: BaseSQLiteDatabase<"async", unknown>;
};

const pub = os.$context<Context>();

export const router = {
  health: pub.handler(async () => {
    return { status: "ok" as const };
  }),
};

export type Router = typeof router;

/** Client-safe type — no Cloudflare deps in the import chain */
export type AppClient = RouterClient<Router>;
