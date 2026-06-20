import { z } from "zod";

export const paymentMethodType = z.enum([
  "bank_account",
  "credit_card",
  "certified_check",
]);

export type PaymentMethodType = z.infer<typeof paymentMethodType>;

export const PAYMENT_METHOD_TYPES = [
  { value: paymentMethodType.enum.credit_card, label: "Tarjeta de crédito" },
  { value: paymentMethodType.enum.bank_account, label: "Cuenta bancaria" },
  {
    value: paymentMethodType.enum.certified_check,
    label: "Cheque certificado",
  },
] as { value: PaymentMethodType; label: string }[];

// Alta de un medio de pago. El monto lo fija el backoffice al validarlo, así
// que no viaja desde el cliente; tampoco se persisten datos sensibles (CVV,
// número completo): `details` ya llega armado y enmascarado desde la app.
export const createPaymentMethodSchema = z.object({
  type: paymentMethodType,
  details: z.string().trim().min(1, "Completá los datos del medio"),
});

export type CreatePaymentMethodInput = z.infer<
  typeof createPaymentMethodSchema
>;
