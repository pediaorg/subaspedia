import z from "zod";

import { AuctionCategory, auctionCategory } from "../index";

export const userCountrySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
});

export const userSchema = z.object({
  id: z.number().int().positive(),
  email: z.email(),
  name: z.string().nullable(),
  surname: z.string().nullable(),
  documentId: z.string().nullable(),
  address: z.string().nullable(),
  country: userCountrySchema.nullable(),
  category: auctionCategory.nullable(),
  avatarUrl: z.url().nullable(),
  admitted: z.boolean(),
  createdAt: z.iso.datetime(),
});

export type User = z.infer<typeof userSchema>;
export type UserCategory = z.infer<typeof auctionCategory>;

export const USER_CATEGORIES = [
  { value: auctionCategory.enum.common, label: "Común" },
  { value: auctionCategory.enum.special, label: "Especial" },
  { value: auctionCategory.enum.silver, label: "Plata" },
  { value: auctionCategory.enum.gold, label: "Oro" },
  { value: auctionCategory.enum.platinum, label: "Platino" },
] as { value: UserCategory; label: string }[];

export function isOnboarded(user: User): boolean {
  return (
    user.name !== null && user.documentId !== null && user.category !== null
  );
}

export const updateProfileInputSchema = userSchema
  .pick({
    name: true,
    surname: true,
    documentId: true,
    address: true,
    country: true,
    avatarUrl: true,
    email: true,
  })
  .partial(); // esto hace que solo tome lo que se actualiza, y permita campos vacios

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
