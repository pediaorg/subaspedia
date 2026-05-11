import { auctionDurableObject } from "./auction";
import { db } from "./database";
import { jwtSecret, secrets } from "./secrets";
import { apiDomain, stage, webDomain } from "./stage";

export const api = new sst.cloudflare.Worker("Api", {
  handler: "../../apps/api/src/index.ts",
  url: true,
  domain: apiDomain,
  link: [db, ...secrets],
  environment: {
    WEB_ORIGIN: `https://${webDomain}`,
  },
  transform: {
    worker: workerArgs => {
      workerArgs.compatibilityDate = "2026-04-02";
      workerArgs.compatibilityFlags = [
        "nodejs_compat",
        "global_fetch_strictly_public",
      ];
      workerArgs.observability = {
        enabled: true,
        headSamplingRate: 1,
        logs: {
          enabled: true,
          headSamplingRate: 1,
          persist: true,
          invocationLogs: true,
        },
      };
      workerArgs.bindings = $output(workerArgs.bindings).apply(existing => [
        ...(existing ?? []),
        { type: "secret_text", name: "JWT_SECRET", text: jwtSecret.value },
      ]);
      auctionDurableObject(workerArgs);
    },
  },
});

export const apiPublicUrl = `https://${apiDomain}`;

export { stage };
