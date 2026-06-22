import { z } from "zod";

// Método de entrega del bien comprado (post-subasta). La consigna define dos
// opciones: envío a la dirección declarada (su costo va en la factura) o retiro
// personal (en cuyo caso el bien pierde la cobertura del seguro). El envío es el
// caso por DEFAULT: una venta sin elección explícita se trata como 'shipping'.
//
// Vive en su propio módulo (sin dependencias) a propósito, igual que `currency`:
// el barrel `index.ts` lo re-exporta y `transaction/` lo importa, y tenerlo como
// hoja evita ciclos de imports.
export const deliveryMethod = z.enum(["shipping", "pickup"]);

export type DeliveryMethod = z.infer<typeof deliveryMethod>;

export const DELIVERY_METHOD_LABELS = [
  { value: deliveryMethod.enum.shipping, label: "Envío a domicilio" },
  { value: deliveryMethod.enum.pickup, label: "Retiro personal" },
] as { value: DeliveryMethod; label: string }[];
