import { apiPublicUrl } from "./api";
import { route53Cname } from "./dns";
import { webDomain } from "./stage";

export const web = new sst.cloudflare.StaticSite("Web", {
  path: "../../apps/mobile",
  build: {
    command: "pnpm exec expo export -p web",
    output: "dist",
  },
  environment: {
    EXPO_PUBLIC_API_URL: apiPublicUrl,
  },
});

route53Cname({
  name: "WebDns",
  recordName: webDomain,
  target: web.url.apply((u) => new URL(u).hostname),
});
