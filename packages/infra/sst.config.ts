/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "subaspedia",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "cloudflare",
      providers: {
        cloudflare: "6.13.0",
        aws: "7.10.0",
      },
    };
  },
  async run() {
    await import("./modules/secrets");
    await import("./modules/dns");
    await import("./modules/database");
    const { api } = await import("./modules/api");
    const { web } = await import("./modules/web");

    return {
      api: api.url,
      web: web.url,
    };
  },
});
