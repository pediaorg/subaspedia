import type { RouterClient } from "@orpc/server";

import { pub } from "./context";
import { countriesRouter } from "./routers/countries";

export type { Context } from "./context";
export { pub } from "./context";

export const router = {
  health: pub.handler(async () => {
    return { status: "ok" as const };
  }),
  countries: countriesRouter,
};

export type Router = typeof router;

/** Client-safe type — no Cloudflare deps in the import chain */
export type AppClient = RouterClient<Router>;
