import { z } from "zod";

export const createAuctionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long"),
  imageUrl: z
    .string()
    .url("Must be a valid image URL")
    .optional()
    .or(z.literal("")),
  category: z.string().min(2, "Category is required"),
  startingPrice: z
    .number()
    .positive("Starting price must be greater than zero"),
  reservePrice: z.number().positive("Reserve price must be greater than zero"),
  startTime: z.string().datetime("Invalid start time format"),
  endTime: z.string().datetime("Invalid end time format"),
});

export const createBidSchema = z.object({
  auctionId: z.string().uuid("Invalid auction ID format"),
  amount: z.number().positive("Bid amount must be positive"),
});
