export type TravelRequestStatus = "pending" | "approved" | "rejected";

export type TravelRequest = {
  id: number;
  requesterName: string;
  destination: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: TravelRequestStatus;
  createdAt: string;
  decisionNote?: string;
};
