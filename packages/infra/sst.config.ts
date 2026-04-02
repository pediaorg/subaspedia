/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "subaspedia",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "cloudflare",
    };
  },
  async run() {},
});
