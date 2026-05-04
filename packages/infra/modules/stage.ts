export const stage = $app.stage;
export const isProduction = stage === "production";
export const isPreview = stage.startsWith("pr-");

export const ZONE_NAME = "casareski.com";

export function webDomainFor(s: string): string {
  if (s === "production") return `app.${ZONE_NAME}`;
  return `${s}.${ZONE_NAME}`;
}

export function apiDomainFor(s: string): string {
  if (s === "production") return `api.${ZONE_NAME}`;
  return `${s}-api.${ZONE_NAME}`;
}

export const webDomain = webDomainFor(stage);
export const apiDomain = apiDomainFor(stage);
