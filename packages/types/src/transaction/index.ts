import { z } from "zod";

import { currency } from "../index";

// Estado del pedido tras ganar y pagar una subasta. La consigna define que el
// comprador paga el envío a la dirección declarada O retira personalmente (y en
// ese caso pierde el seguro) -> de ahí los estados de entrega.
export const orderStatus = z.enum([
  "paid", // pagado, todavía no despachado
  "shipped", // en camino a la dirección declarada
  "delivered", // entregado por envío
  "picked_up", // retirado en persona
]);

export type OrderStatus = z.infer<typeof orderStatus>;

export const ORDER_STATUS_LABELS = [
  { value: orderStatus.enum.paid, label: "Pagado" },
  { value: orderStatus.enum.shipped, label: "En camino" },
  { value: orderStatus.enum.delivered, label: "Entregado" },
  { value: orderStatus.enum.picked_up, label: "Retirado" },
] as { value: OrderStatus; label: string }[];

// Una transacción del historial = una compra concretada (bien adquirido). Los
// pagos de multa NO entran acá (viven en su propia pantalla). `img` es la foto
// del producto comprado, que el back resuelve igual que en products (tabla
// `photos` -> firstPhotoToImg): por eso es no-nullable.
export const transactionSchema = z.object({
  id: z.number().int().positive(),
  productName: z.string(),
  img: z.url(),
  // Total pagado = puja + comisiones + envío.
  amount: z.number().positive(),
  currency,
  date: z.iso.datetime(),
  auctionId: z.number().int().positive().nullable(),
  status: orderStatus,
});

export type Transaction = z.infer<typeof transactionSchema>;
