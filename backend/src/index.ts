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
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Make io accessible in your controllers
app.set("io", io);

io.on("connection", (socket) => {
  // Allow users to join a room specific to the auction they are viewing
  socket.on("joinAuction", (auctionId) => socket.join(auctionId));
});
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
server.listen(PORT, () => {
  console.log(`Server is running on   http://localhost:${PORT}`);
});
