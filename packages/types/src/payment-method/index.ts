import { z } from "zod";

export const paymentMethodType = z.enum([
  "bank_account", // cuenta bancaria
  "credit_card", // tarjeta de crédito
  "certified_check", // cheque certificado
]);

export type PaymentMethodType = z.infer<typeof paymentMethodType>;

export const PAYMENT_METHOD_TYPE_LABELS = [
  { value: paymentMethodType.enum.bank_account, label: "Cuenta bancaria" },
  { value: paymentMethodType.enum.credit_card, label: "Tarjeta de crédito" },
  {
    value: paymentMethodType.enum.certified_check,
    label: "Cheque certificado",
  },
] as { value: PaymentMethodType; label: string }[];

// Local (Argentina) o del exterior. Aplica a banco y tarjeta; el cheque
// certificado es siempre local en este modelo.
export const paymentMethodScope = z.enum(["local", "foreign"]);
export type PaymentMethodScope = z.infer<typeof paymentMethodScope>;

// Campos comunes a todos los medios de pago.
const paymentMethodBase = {
  id: z.number().int().positive(),
  holderName: z.string(), // titular
  // Sin medio verificado solo se puede mirar, no pujar (regla de dominio).
  verified: z.boolean(),
};

export const paymentMethodSchema = z.discriminatedUnion("type", [
  z.object({
    ...paymentMethodBase,
    type: z.literal(paymentMethodType.enum.bank_account),
    scope: paymentMethodScope,
    // CBU si es local, IBAN si es del exterior.
    accountNumber: z.string(),
    bankName: z.string(),
  }),
  z.object({
    ...paymentMethodBase,
    type: z.literal(paymentMethodType.enum.credit_card),
    scope: paymentMethodScope,
    // Nunca guardamos el PAN completo: solo los últimos 4 y la marca.
    last4: z.string().length(4),
    brand: z.string(),
  }),
  z.object({
    ...paymentMethodBase,
    type: z.literal(paymentMethodType.enum.certified_check),
    checkNumber: z.string(),
    bankName: z.string(),
  }),
]);

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
