import type { RouterClient } from "@orpc/server";

import { pub } from "@/api/context";

import { auctionsRouter } from "./routers/auctions";
import { authRouter } from "./routers/auth";
import { backofficeRouter } from "./routers/backoffice";
import { countriesRouter } from "./routers/countries";
import { userRouter } from "./routers/user";
import { productsRouter } from "./routers/products";

export const router = {
  health: pub.handler(async () => {
    return { status: "ok" as const };
  }),
  auctions: auctionsRouter,
  countries: countriesRouter,
  products: productsRouter,
  auth: authRouter,
  backoffice: backofficeRouter,
  user: userRouter,
};

export type Router = typeof router;

/** Client-safe type — no Cloudflare deps in the import chain */
export type AppClient = RouterClient<Router>;
