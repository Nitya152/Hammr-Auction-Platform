import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-development-key";

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // 1. Destructure 'role' along with name, email, and password from req.body
    const { name, email, password, role } = req.body;

    // 2. Validate that the role is valid, fallback to SELLER if missing
    const validRoles = ["BUYER", "SELLER", "ADMIN"];
    const assignedRole = validRoles.includes(role) ? role : "SELLER";

    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Explicitly pass 'role: assignedRole' to prisma.user.create
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword, // (Note: ensure this matches your schema property name like passwordHash or password)
        role: assignedRole,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Accept mfaCode from the request body
    const { email, password, mfaCode } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // 2. CHECK FOR 2FA
    if (user.isTwoFactorReady && user.twoFactorSecret) {
      // If the user hasn't provided a code yet, tell the frontend to prompt them
      if (!mfaCode) {
        res.status(200).json({
          mfaRequired: true,
          message: "Please enter your Microsoft Authenticator code.",
        });
        return;
      }

      // If they provided a code, verify it
      const isCodeValid = authenticator.verify({
        token: mfaCode,
        secret: user.twoFactorSecret,
      });
      if (!isCodeValid) {
        res.status(401).json({ error: "Invalid Authenticator code" });
        return;
      }
    }

    // 3. Issue JWT Token if everything passes
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
};
