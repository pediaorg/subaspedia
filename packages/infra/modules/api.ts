import {
  AUCTION_DO_BINDING,
  AUCTION_DO_CLASS,
  AUCTION_DO_MIGRATION_TAG,
} from "./auction";
import { db } from "./database";
import { route53Cname } from "./dns";
import { secrets } from "./secrets";
import { apiDomain, isProduction, stage } from "./stage";

export const api = new sst.cloudflare.Worker("Api", {
  handler: "../../apps/api/src/index.ts",
  url: true,
  link: [db, ...secrets],
  transform: {
    worker: (workerArgs) => {
      workerArgs.compatibilityDate = "2026-04-02";
      workerArgs.compatibilityFlags = [
        "nodejs_compat",
        "global_fetch_strictly_public",
      ];
      workerArgs.observability = { enabled: true };
      workerArgs.migrations = {
        oldTag: undefined,
        newTag: AUCTION_DO_MIGRATION_TAG,
        newClasses: [AUCTION_DO_CLASS],
      } as any;
      const dynamicBindings = (workerArgs.bindings ?? []) as any[];
      dynamicBindings.push({
        type: "durable_object_namespace",
        name: AUCTION_DO_BINDING,
        className: AUCTION_DO_CLASS,
      });
      workerArgs.bindings = dynamicBindings as any;
    },
  },
});

route53Cname({
  name: "ApiDns",
  recordName: apiDomain,
  target: api.url.apply((u) => new URL(u!).hostname),
});

export const apiPublicUrl = isProduction
  ? `https://${apiDomain}`
  : `https://${apiDomain}`;

export { stage };
