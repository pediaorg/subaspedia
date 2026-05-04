import { apiPublicUrl } from "./api";
import { webDomain } from "./stage";

export const web = new sst.cloudflare.StaticSiteV2("Web", {
  path: "../../apps/mobile",
  build: {
    command: "pnpm exec expo export -p web",
    output: "dist",
  },
  domain: webDomain,
  environment: {
    EXPO_PUBLIC_API_URL: apiPublicUrl,
  },
});
