import { Request, Response } from "express";
import { prisma } from "../prisma";
import { AuthRequest } from "../middleware/authMiddleware";

export const placeBid = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { auctionId, amount } = req.body;
    const bidderId = req.user!.userId;

    // 1. Fetch the auction to check the rules
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
    });

    if (!auction) {
      res.status(404).json({ error: "Auction not found" });
      return;
    }

    // 2. Validate auction time (Optional but recommended)
    const now = new Date();
    if (now < auction.startTime || now > auction.endTime) {
      res.status(400).json({ error: "This auction is not currently active" });
      return;
    }

    // 3. Ensure the bid is high enough
    // Prisma returns Decimal as an object, so we convert them to JavaScript Numbers for math
    const currentHigh = Number(auction.currentHighest);
    const minInc = Number(auction.minIncrement);
    const startPrice = Number(auction.startingPrice);

    const minRequired = currentHigh > 0 ? currentHigh + minInc : startPrice;

    if (amount < minRequired) {
      res.status(400).json({ error: `Bid must be at least ${minRequired}` });
      return;
    }

    // 4. Use a Prisma Transaction to safely create the bid AND update the auction price together
    const [newBid, updatedAuction] = await prisma.$transaction([
      prisma.bid.create({
        data: { auctionId, bidderId, amount },
      }),
      prisma.auction.update({
        where: { id: auctionId },
        data: { currentHighest: amount },
      }),
    ]);

    res.status(201).json({ message: "Bid placed successfully", bid: newBid });
  } catch (error) {
    console.error("Bid Error:", error);
    res.status(500).json({ error: "Failed to place bid" });
  }
};

export const getAuctionBids = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Explicitly tell TypeScript this is a single string
    const auctionId = req.params.auctionId as string;

    // Fetch all bids for a specific auction, sorted highest to lowest
    const bids = await prisma.bid.findMany({
      where: { auctionId },
      include: { bidder: { select: { name: true } } },
      orderBy: { amount: "desc" },
    });

    res.status(200).json(bids);
  } catch (error) {
    console.error("Fetch Bids Error:", error);
    res.status(500).json({ error: "Failed to fetch bids" });
  }
};
