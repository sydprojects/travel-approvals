import { z } from "zod";

export const createTravelRequestSchema = z.object({
  requesterName: z.string().trim().min(2).max(80),
  destination: z.string().trim().min(2).max(80),
  startDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  endDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
  reason: z.string().trim().min(10).max(500),
}).refine((data) => Date.parse(data.startDate) <= Date.parse(data.endDate), {
  message: "startDate must be before or equal to endDate",
  path: ["endDate"],
});

export type CreateTravelRequestInput = z.infer<typeof createTravelRequestSchema>;

export const decisionSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  decisionNote: z.string().trim().max(500).optional(),
});

export type DecisionInput = z.infer<typeof decisionSchema>;
