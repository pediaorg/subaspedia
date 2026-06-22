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
  createdAt: z.iso.datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;

export const createNotificationSchema = z.object({
  clientId: z.number().int().positive(),
  title: z.string().min(1),
  body: z.string().min(1),
  route: notificationRoute,
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
