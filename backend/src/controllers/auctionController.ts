import { Request, Response } from "express";
import { prisma } from "../prisma";
import { AuthRequest } from "../middleware/authMiddleware";
import { createAuctionSchema } from "../validators/auctionValidator";

// Get all auctions
export const getAllAuction = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        seller: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(auctions);
  } catch (error) {
    console.error("Fetch Auctions Error:", error);
    res.status(500).json({ error: "Failed to fetch auctions" });
  }
};

// Create a new auction with Zod validation
export const createAuction = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const validationResult = createAuctionSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorMessage =
        validationResult.error.issues[0]?.message || "Validation failed";
      res.status(400).json({ error: errorMessage });
      return;
    }

    const data = validationResult.data;
    const sellerId = req.user?.userId;

    if (!sellerId) {
      res.status(401).json({ error: "Unauthorized seller" });
      return;
    }

    const auction = await prisma.auction.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl || "",
        category: data.category,
        startingPrice: data.startingPrice,
        currentHighest: data.startingPrice,
        reservePrice: data.reservePrice,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        sellerId,
        status: new Date(data.startTime) <= new Date() ? "LIVE" : "SCHEDULED",
      },
    });

    res.status(201).json(auction);
  } catch (error) {
    console.error("Create Auction Error:", error);
    res
      .status(500)
      .json({ error: "Internal server error while creating auction" });
  }
};
// Add this export alongside your existing functions
export const getAuctionById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = typeof req.params.id === "string" ? req.params.id : undefined;

    if (!id) {
      res.status(400).json({ error: "Invalid auction ID" });
      return;
    }

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: { name: true }, // We need this for the "Verified Seller" badge
        },
      },
    });

    if (!auction) {
      res.status(404).json({ error: "Auction not found" });
      return;
    }

    res.status(200).json(auction);
  } catch (error) {
    console.error("Fetch single auction error:", error);
    res.status(500).json({ error: "Failed to fetch auction" });
  }
};

// Delete an auction (Admin or owner control)
export const deleteAuction = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id as string;

    await prisma.auction.delete({ where: { id } });
    res.status(200).json({ message: "Auction deleted successfully" });
  } catch (error) {
    console.error("Delete Auction Error:", error);
    res.status(500).json({ error: "Failed to delete auction" });
  }
};
