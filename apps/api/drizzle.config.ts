import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "drizzle-kit";

const remote = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  databaseId: process.env.D1_DATABASE_ID,
  token: process.env.CLOUDFLARE_API_TOKEN,
};

function getLocalD1Url() {
  const d1Dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
  const files = fs.readdirSync(d1Dir);
  const db = files.find(f => f.endsWith(".sqlite") && !f.includes("metadata"));
  if (!db)
    throw new Error(
      "No se encontró la DB local de D1. Levantá el API primero.",
    );
  return path.join(d1Dir, db);
}

export default defineConfig(
  remote.accountId && remote.databaseId && remote.token
    ? {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "sqlite",
        driver: "d1-http",
        dbCredentials: {
          accountId: remote.accountId,
          databaseId: remote.databaseId,
          token: remote.token,
        },
      }
    : {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: { url: getLocalD1Url() },
      },
);
