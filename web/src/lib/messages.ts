/**
 * Single source of truth for user-facing field error copy. Used by both
 * CreateRequestForm's client-side validate() and the zod schemas, so a
 * server-returned error reads identically to a client-side one - without
 * this, zod's default messages (e.g. "String must contain at least 2
 * character(s)") would reach the user any time server-side validation
 * caught something client-side validation didn't.
 */
export const MESSAGES = {
  requesterName: {
    required: "Enter the requester's name.",
    tooLong: "Keep the requester's name to 80 characters or fewer.",
  },
  destination: {
    required: "Enter a destination.",
    tooLong: "Keep the destination to 80 characters or fewer.",
  },
  startDate: {
    invalid: "Enter a valid start date.",
  },
  endDate: {
    invalid: "Enter a valid end date.",
    beforeStart: "End date must be on or after the start date.",
  },
  reason: {
    tooShort: "Reason must be at least 10 characters.",
    tooLong: "Keep the reason to 500 characters or fewer.",
  },
} as const;
