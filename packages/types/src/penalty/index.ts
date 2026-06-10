import { z } from "zod";

export const penaltyStatus = z.enum(["pending", "paid", "overdue"]);

export type PenaltyStatus = z.infer<typeof penaltyStatus>;

export const PENALTY_STATUS_LABELS = [
  { value: penaltyStatus.enum.pending, label: "Pendiente" },
  { value: penaltyStatus.enum.paid, label: "Pagada" },
  { value: penaltyStatus.enum.overdue, label: "Vencida" },
] as { value: PenaltyStatus; label: string }[];

export const penaltySchema = z.object({
  id: z.number().int().positive(),
  reason: z.string(),
  amount: z.number().positive(),
  status: penaltyStatus,
  issuedAt: z.iso.datetime(),
  dueDate: z.iso.datetime(),
  auctionId: z.number().int().positive().nullable(),
});

export type Penalty = z.infer<typeof penaltySchema>;
