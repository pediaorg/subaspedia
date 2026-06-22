import { z } from "zod";

import { currency } from "../currency";

// Protocolo del WebSocket de subasta en vivo (servidor -> cliente y
// cliente -> servidor). Es el contrato que comparten el Durable Object
// `AuctionRoom` (apps/api) y el cliente mobile. La autoridad de la lógica vive
// en el DO: estos tipos solo describen los mensajes que viajan por el socket.

// Reglas de incremento de la puja dinámica ascendente (consigna):
//   - mínimo: última oferta + 1% del precio base del bien.
//   - máximo: última oferta + 20% del precio base (NO aplica a oro/platino).
// El 1% / 20% se modelan acá como constantes para que api y front coincidan.
export const MIN_BID_INCREMENT_RATE = 0.01;
export const MAX_BID_INCREMENT_RATE = 0.2;

// Ventana de la puja: tras cada puja aceptada se reinicia este contador. Si
// nadie supera la oferta antes de que venza, la subasta del ítem se cierra y el
// último postor pasa a ser el dueño.
export const BID_WINDOW_MS = 60_000;

// Quién tiene la puja más alta en este momento.
export const auctionLeader = z.object({
  clientId: z.number().int().positive(),
  bidderNumber: z.number().int().positive(),
  name: z.string(),
});

export type AuctionLeader = z.infer<typeof auctionLeader>;

// Estado completo de la subasta que el DO difunde a todos los conectados cada
// vez que algo cambia (puja nueva, cierre, etc.).
export const auctionState = z.object({
  type: z.literal("state"),
  auctionId: z.number().int().positive(),
  // Ítem del catálogo que se está rematando AHORA. La subasta recorre el
  // catálogo ítem por ítem; este campo le dice al cliente cuál mostrar.
  itemId: z.number().int().positive(),
  // Progreso dentro del catálogo (1-based) y total de ítems, para mostrar
  // "Lote 2 de 5" en la UI.
  itemNumber: z.number().int().positive(),
  itemCount: z.number().int().positive(),
  status: z.enum(["open", "closed"]),
  currency,
  basePrice: z.number(),
  // 0 cuando todavía no hubo ninguna puja (se muestra el precio base).
  currentBid: z.number(),
  // Próxima puja válida mínima/máxima ya calculadas por el DO. `maxBid` es null
  // en subastas oro/platino (sin tope).
  minBid: z.number(),
  maxBid: z.number().nullable(),
  leader: auctionLeader.nullable(),
  // Epoch ms en que se cierra la subasta si nadie puja, o null si el contador
  // todavía no arrancó (sin pujas).
  deadline: z.number().nullable(),
});

export type AuctionState = z.infer<typeof auctionState>;

// Mensaje de error dirigido a un solo socket (p. ej. puja inválida).
export const auctionErrorMsg = z.object({
  type: z.literal("error"),
  message: z.string(),
});

export type AuctionErrorMsg = z.infer<typeof auctionErrorMsg>;

// Aviso de cierre con el ganador final (o null si nadie pujó).
export const auctionClosedMsg = z.object({
  type: z.literal("closed"),
  auctionId: z.number().int().positive(),
  winner: auctionLeader.nullable(),
  amount: z.number(),
});

export type AuctionClosedMsg = z.infer<typeof auctionClosedMsg>;

// Aviso de que se cerró UN ítem del catálogo (se vendió o nadie pujó) y la
// subasta sigue con el próximo. `hasNext` distingue "pasa al siguiente" del
// cierre final (que llega aparte como `closed`).
export const auctionItemClosedMsg = z.object({
  type: z.literal("item-closed"),
  auctionId: z.number().int().positive(),
  itemId: z.number().int().positive(),
  winner: auctionLeader.nullable(),
  amount: z.number(),
  hasNext: z.boolean(),
});

export type AuctionItemClosedMsg = z.infer<typeof auctionItemClosedMsg>;

// Unión de todo lo que el servidor puede mandar.
export const auctionServerMsg = z.discriminatedUnion("type", [
  auctionState,
  auctionErrorMsg,
  auctionClosedMsg,
  auctionItemClosedMsg,
]);

export type AuctionServerMsg = z.infer<typeof auctionServerMsg>;

// Mensaje que el cliente manda para pujar. La identidad sale del token con el
// que se conectó (no se confía en el clientId del payload).
export const auctionBidMsg = z.object({
  type: z.literal("bid"),
  amount: z.number().positive(),
});

export type AuctionBidMsg = z.infer<typeof auctionBidMsg>;

export const auctionClientMsg = z.discriminatedUnion("type", [auctionBidMsg]);

export type AuctionClientMsg = z.infer<typeof auctionClientMsg>;
