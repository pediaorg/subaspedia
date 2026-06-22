import { z } from "zod";

// Tipo de notificación: define el ícono que se muestra en la lista y la
// pantalla a la que redirige el botón del detalle.
export const notificationRoute = z.enum([
  "winProduct",
  "sanction",
  "paymentMethod",
  "proposal",
  "auction",
]);

export type NotificationRoute = z.infer<typeof notificationRoute>;

export const notificationSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  body: z.string(),
  route: notificationRoute,
  // Id de la entidad a la que apunta la notificación, para deep-linkear al
  // detalle. Es POLIMÓRFICO según `route`: winProduct -> venta (registro de
  // subasta), auction -> subasta, sanction -> multa, etc. Nullable porque una
  // notificación puede no tener un destino puntual.
  targetId: z.number().int().positive().nullable(),
  createdAt: z.iso.datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const createNotificationSchema = z.object({
  clientId: z.number().int().positive(),
  title: z.string().min(1),
  body: z.string().min(1),
  route: notificationRoute,
  targetId: z.number().int().positive().nullable().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
