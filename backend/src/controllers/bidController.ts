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

    // 1. Use an Interactive Transaction to lock the row and prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 2. Lock the auction row (FOR UPDATE).
      // If multiple users bid simultaneously, Postgres forces them to evaluate sequentially.
      const lockedAuctions = await tx.$queryRaw<any[]>`
        SELECT * FROM "Auction" WHERE id = ${auctionId} FOR UPDATE
      `;

      if (!lockedAuctions || lockedAuctions.length === 0) {
        return { status: 404, error: "Auction not found" };
      }

      const auction = lockedAuctions[0];

      // 3. Validate auction time
      const now = new Date();
      if (
        now < new Date(auction.startTime) ||
        now > new Date(auction.endTime)
      ) {
        return { status: 400, error: "This auction is not currently active" };
      }

      // 4. Ensure the bid is high enough based on the TRULY latest locked price
      const currentHigh = Number(auction.currentHighest);
      const minInc = auction.minIncrement ? Number(auction.minIncrement) : 10;
      const startPrice = Number(auction.startingPrice);

      const minRequired = currentHigh > 0 ? currentHigh + minInc : startPrice;

      if (amount < minRequired) {
        return { status: 400, error: `Bid must be at least ${minRequired}` };
      }

      // 5. Update the auction price and save the bid while still locked
      await tx.auction.update({
        where: { id: auctionId },
        data: { currentHighest: amount },
      });

      const newBid = await tx.bid.create({
        data: { auctionId, bidderId, amount },
      });

      return { status: 201, bid: newBid };
    });

    // Handle validation failures that occurred inside the transaction
    if (result.error) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    // 6. Broadcast the new bid price via WebSockets
    const io = req.app.get("io");
    if (io) {
      io.to(auctionId).emit("bidUpdate", {
        auctionId: auctionId,
        newHighestBid: amount,
      });
    }

    res
      .status(201)
      .json({ message: "Bid placed successfully", bid: result.bid });
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
