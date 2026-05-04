import { stage } from "./stage";

export const db = new sst.cloudflare.D1("Db", {
  transform: {
    database: { name: `subaspedia-${stage}` },
  },
});
