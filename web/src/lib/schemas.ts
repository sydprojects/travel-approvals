import { z } from "zod";
import { MESSAGES } from "./messages";

export const createTravelRequestSchema = z.object({
  requesterName: z.string().trim().min(2, MESSAGES.requesterName.required).max(80, MESSAGES.requesterName.tooLong),
  destination: z.string().trim().min(2, MESSAGES.destination.required).max(80, MESSAGES.destination.tooLong),
  startDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), MESSAGES.startDate.invalid),
  endDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), MESSAGES.endDate.invalid),
  reason: z.string().trim().min(10, MESSAGES.reason.tooShort).max(500, MESSAGES.reason.tooLong),
}).refine((data) => Date.parse(data.startDate) <= Date.parse(data.endDate), {
  message: MESSAGES.endDate.beforeStart,
  path: ["endDate"],
});

export type CreateTravelRequestInput = z.infer<typeof createTravelRequestSchema>;

export const decisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  decisionNote: z.string().trim().max(500).optional(),
});

export type DecisionInput = z.infer<typeof decisionSchema>;
