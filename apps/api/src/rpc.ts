import type { RouterClient } from "@orpc/server";

import { pub } from "@/api/context";

import { authRouter } from "./routers/auth";
import { backofficeRouter } from "./routers/backoffice";
import { countriesRouter } from "./routers/countries";
import { productsRouter } from "./routers/products";
import { userRouter } from "./routers/user";
import { usersRouter } from "./routers/users";

export const router = {
  health: pub.handler(async () => {
    return { status: "ok" as const };
  }),
  countries: countriesRouter,
  products: productsRouter,
  auth: authRouter,
  backoffice: backofficeRouter,
  user: userRouter,
  users: usersRouter,
};

export type Router = typeof router;

/** Client-safe type — no Cloudflare deps in the import chain */
export type AppClient = RouterClient<Router>;
