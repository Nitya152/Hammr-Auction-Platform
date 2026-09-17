import { Router } from "express";
import {
  createAuction,
  deleteAuction,
  getAllAuction,
  getAuctionById,
} from "../controllers/auctionController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Public route: Anyone can see the auctions
router.get("/", getAllAuction);

// Protected route: Must be logged in to create an auction
router.post("/", requireAuth, createAuction);

// 2. Add the dynamic ID route
router.get("/:id", getAuctionById);

// To delete
router.delete("/:id", requireAuth, deleteAuction);

export default router;
