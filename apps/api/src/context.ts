import { os } from "@orpc/server";

import type { createDb } from "./db";

export type Context = {
  db: ReturnType<typeof createDb>;
};

export const pub = os.$context<Context>();
