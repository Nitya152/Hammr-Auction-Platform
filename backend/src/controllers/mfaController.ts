import { Response } from "express";
import { authenticator } from "otplib";
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

    // Generate a new secure secret for this user
    const secret = authenticator.generateSecret();

    // Create the URI that Microsoft Authenticator understands
    // Format: keyuri(accountName, issuer, secret)
    const otpauthUrl = authenticator.keyuri(user.email, "Hammr", secret);

    // Convert the URI into a scannable QR Code image (Base64 string)
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // IMPORTANT: We send the secret to the frontend temporarily so it can be sent back
    // during verification. We don't save it to the DB until they prove they can scan it.
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
    const { token, secret } = req.body; // token is the 6-digit code from Microsoft Authenticator

    if (!userId || !token || !secret) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    // Verify the 6-digit code against the secret
    const isValid = authenticator.verify({ token, secret });

    if (!isValid) {
      res
        .status(400)
        .json({ error: "Invalid 6-digit code. Please try again." });
      return;
    }

    // If valid, officially save the secret to the DB and enable 2FA
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
