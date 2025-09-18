import { z } from "zod";

export const createListingSchema = z.object({
  kind: z.enum(["OFFER", "NEED"]),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  categories: z.array(z.string()),
  priceType: z.enum(["BARTER", "CASH", "BOTH"]),
  cashPrice: z.number().optional(),
  creditPrice: z.number().optional(),
  preferredMeet: z.enum(["IN_PERSON", "REMOTE"]),
  locationId: z.string().optional(),
  images: z.array(z.string()).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});

export const createReviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  body: z.string().min(1),
});