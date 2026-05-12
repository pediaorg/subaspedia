import z from "zod";

export const JWT_PAYLOAD = z.object({
  sub: z.number().int().positive(), // Subject, Claim con el userID
  type: z.enum(["access", "refresh"]), // Tipo de JWT q es. `access` = autenticar, `refresh` = generar un `access` nuevo c/ tanto
  iat: z.number().int().nonnegative(), // Issued at
  exp: z.number().int().positive(), // Expiration
});

export type JWTPayload = z.infer<typeof JWT_PAYLOAD>;

export const BEARER_TOKEN = z
  .string()
  .regex(/^Bearer\s+\S+$/i, "Formato Bearer inválido")
  .transform(s => s.replace(/^Bearer\s+/i, ""));
