import { isProduction, ZONE_NAME } from "./stage";

const zone = cloudflare.getZoneOutput({
  filter: { name: ZONE_NAME },
});

export const zoneId = zone.id;

if (isProduction) {
  new cloudflare.ZoneSetting("AlwaysUseHttps", {
    zoneId,
    settingId: "always_use_https",
    value: "on",
  });
}
