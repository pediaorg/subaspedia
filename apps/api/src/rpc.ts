import type { RouterClient } from "@orpc/server";

import { pub } from "@/api/context";

import { authRouter } from "./routers/auth";
import { backofficeRouter } from "./routers/backoffice";
import { countriesRouter } from "./routers/countries";

export const router = {
  health: pub.handler(async () => {
    return { status: "ok" as const };
  }),
  countries: countriesRouter,
  auth: authRouter,
  backoffice: backofficeRouter,
};

export type Router = typeof router;

/** Client-safe type — no Cloudflare deps in the import chain */
export type AppClient = RouterClient<Router>;
