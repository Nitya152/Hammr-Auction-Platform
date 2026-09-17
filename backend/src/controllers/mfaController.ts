import { Response } from "express";
import { generateSecret, generateURI, verify } from "otplib"; // v13 Imports
import QRCode from "qrcode";
import { prisma } from "../prisma";
import { AuthRequest } from "../middleware/authMiddleware";

// Step 1: Generate the Secret & QR Code
export const setup2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // 1. Generate secret using v13 API
    const secret = generateSecret();

    // 2. Generate URI using v13 API structure
    const otpauthUrl = generateURI({
      issuer: "Hammr",
      label: user.email,
      secret,
    });

    // 3. Convert to QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.status(200).json({
      secret,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    console.error("2FA Setup Error:", error);
    res.status(500).json({ error: "Failed to generate 2FA setup" });
  }
};

// Step 2: Verify the scanned code and save to Database
export const verifyAndEnable2FA = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { token, secret } = req.body;

    if (!userId || !token || !secret) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // 4. In v13, verify() is asynchronous and returns an object!
    const result = await verify({ token, secret });

    if (!result.valid) {
      res
        .status(400)
        .json({ error: "Invalid 6-digit code. Please try again." });
      return;
    }

    // 5. If valid, save the secret to the DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        isTwoFactorReady: true,
      },
    });

    res
      .status(200)
      .json({ message: "Microsoft Authenticator linked successfully!" });
  } catch (error) {
    console.error("2FA Verification Error:", error);
    res.status(500).json({ error: "Failed to verify 2FA" });
  }
};
