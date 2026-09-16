import { Router } from "express";
import { setup2FA, verifyAndEnable2FA } from "../controllers/mfaController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

// Both routes require the user to be logged in
router.get("/setup", requireAuth, setup2FA);
router.post("/verify", requireAuth, verifyAndEnable2FA);

export default router;
