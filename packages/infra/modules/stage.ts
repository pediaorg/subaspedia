export const stage = $app.stage;
export const isProduction = stage === "production";
export const isPreview = stage.startsWith("pr-");

export const ZONE_NAME = "subaspedia.casareski.com";

export function getWebDomain(stage: string): string {
  if (stage === "production") return ZONE_NAME;

  return `${stage}.${ZONE_NAME}`;
}

export function getApiDomain(stage: string): string {
  if (stage === "production") return `api.${ZONE_NAME}`;

  return `api.${stage}.${ZONE_NAME}`;
}

export const webDomain = getWebDomain(stage);
export const apiDomain = getApiDomain(stage);
