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

// El medio de pago tal como lo persiste la tabla `payment_methods`: el dato
// identificatorio viaja como texto ya enmascarado (`details`), no en campos por
// tipo. (Antes esto era una discriminated union rica con bankName/last4/scope,
// pero la DB no guarda esos campos -> no se pueden devolver en el GET.)
export const paymentMethodSchema = z.object({
  id: z.number().int().positive(),
  type: paymentMethodType,
  // Sin medio verificado solo se puede mirar, no pujar (regla de dominio).
  verified: z.boolean(),
  // Detalle enmascarado que arma la app al cargar el medio (ej. "Visa ****4242").
  details: z.string(),
  // Comprobante/foto del medio (data URI base64), opcional.
  photo: z.string().nullable(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
