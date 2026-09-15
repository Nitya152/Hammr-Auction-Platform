import { Router } from "express";
import { placeBid, getAuctionBids } from "../controllers/bidController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Public route: Anyone can view the bid history for an auction
router.get("/:auctionId", getAuctionBids);

// Protected route: You must be logged in to place a bid
router.post("/", requireAuth, placeBid);

export default router;
