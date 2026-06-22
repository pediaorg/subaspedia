import { z } from "zod";

import { deliveryMethod } from "../delivery";
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
  // Total pagado = puja + comisiones + envío (el envío suma solo si el método
  // resuelto es 'shipping').
  amount: z.number().positive(),
  currency,
  date: z.iso.datetime(),
  auctionId: z.number().int().positive().nullable(),
  status: orderStatus,
  // Método de entrega resuelto. Default 'shipping' si el comprador no eligió.
  deliveryMethod,
  // Costo de envío incluido en `amount` (0 si el método es 'pickup').
  shippingCost: z.number().nonnegative(),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Detalle de una compra (la "factura"). Desglosa lo que la consigna manda
// informar al ganador: lo pujado, las comisiones y el costo de envío a la
// dirección declarada. `shippingAddress` se omite (null) cuando el método es
// 'pickup' (retiro personal, sin envío).
export const transactionDetailSchema = z.object({
  id: z.number().int().positive(),
  productName: z.string(),
  img: z.url(),
  currency,
  date: z.iso.datetime(),
  auctionId: z.number().int().positive().nullable(),
  status: orderStatus,
  deliveryMethod,
  // Desglose de la factura.
  bidAmount: z.number().positive(), // lo pujado
  commissionAmount: z.number().nonnegative(), // comisiones (monto = puja * %)
  shippingCost: z.number().nonnegative(), // costo de envío (0 si pickup)
  total: z.number().positive(), // puja + comisión + envío
  // Dirección declarada a la que se envía. null si es retiro personal.
  shippingAddress: z.string().nullable(),
});

export type TransactionDetail = z.infer<typeof transactionDetailSchema>;
