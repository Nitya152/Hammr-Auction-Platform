import { Router } from "express";
import {
  createAuction,
  deleteAuction,
  getAllAuction,
} from "../controllers/auctionController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Public route: Anyone can see the auctions
router.get("/", getAllAuction);

// Protected route: Must be logged in to create an auction
router.post("/", requireAuth, createAuction);

// To delete
router.delete("/:id", requireAuth, deleteAuction);

export default router;
