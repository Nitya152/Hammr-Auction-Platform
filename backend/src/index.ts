import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./prisma";
import authRoutes from "./routes/authRoutes";
import auctionRoutes from "./routes/auctionRoutes";
import bidRoutes from "./routes/bidRoutes";
import mfaRoutes from "./routes/mfaRoutes";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/auth", authRoutes);
app.use("/auctions", auctionRoutes);
app.use("/bids", bidRoutes);
app.use("/api/mfa", mfaRoutes);

// Database connection health check
app.get("/health", async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "OK", database: "Connected to Neon" });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ status: "ERROR", database: "Disconnected" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on   http://localhost:${PORT}`);
});
