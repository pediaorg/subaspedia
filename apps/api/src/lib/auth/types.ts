import z from "zod";

export {
  ACCESS_CLAIMS,
  type AccessClaims,
  type AuctionCategory as Category,
  auctionCategory as CATEGORY,
  JWT_PAYLOAD,
  type JWTPayload,
} from "@subaspedia/types";

export const BEARER_TOKEN = z
  .string()
  .regex(/^Bearer\s+\S+$/i, "Formato Bearer inválido")
  .transform(s => s.replace(/^Bearer\s+/i, ""));
