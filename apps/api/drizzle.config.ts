import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "drizzle-kit";

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

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: getLocalD1Url(),
  },
});
