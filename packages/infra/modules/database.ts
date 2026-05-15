import { stage } from "./stage";

export const db = new sst.cloudflare.D1("DB", {
  transform: {
    database: { name: `subaspedia-${stage}` },
  },
});
