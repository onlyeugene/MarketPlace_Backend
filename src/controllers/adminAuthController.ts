import { Request, Response } from "express";
import Admin from "../models/admin-model";
import User from "../models/user-model";
import sanitizeHtml from "sanitize-html";
import rateLimitService from "../services/rateLimitService";
import { loginSchema } from "../validations/userValidation";
import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
import { IUserDocument } from "../types/userTypes";

dotenv.config();

type StringValue = `${number}${"ms" | "s" | "m" | "h" | "d" | "w" | "y"}`;

function isStringValue(value: string): value is StringValue {
  return /^\d+(ms|s|m|h|d|w|y)$/.test(value);
}

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
// const APP_URL = process.env.APP_URL || "http://localhost:9540";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

/**
 * Generate JWT token
 * @private
 */
const signToken = (id: string): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as StringValue,
  };
  return jwt.sign({ id }, JWT_SECRET, options);
};

const adminLogin = async (req: Request, res: Response): Promise<void> => {
  let ip = req.ip || "unknown";
  try {
    if (
      rateLimitService.isConnected() &&
      (await rateLimitService.isRateLimited(ip, "adminLogin", 5, 900))
    ) {
      res.status(429).json({
        status: "error",
        message: "Too many login attempts. Please try again later.",
      });
      return;
    }

    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "adminLogin", 900);
      }
      res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message),
      });
      return;
    }

    const { identifier, password } = value as {
      identifier: string;
      password: string;
    };
    if (!identifier || !password) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "adminLogin", 900);
      }
      res
        .status(400)
        .json({
          status: "error",
          message: "Identifier and password are required",
        });
      return;
    }

    const sanitizedIdentifier = sanitizeHtml(identifier);

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedIdentifier);
    const query = isEmail
      ? { email: sanitizedIdentifier }
      : { username: sanitizedIdentifier };
    const admin = (await Admin.findOne(query).select(
      "+password"
    )) as IUserDocument | null;
    if (!admin || !admin.isActive || !(await admin.comparePassword(password))) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "adminLogin", 900);
      }
      res.status(401).json({ status: "error", message: "Invalid credentials" });
      return;
    }

    await admin.logLoginAttempt(ip, true);
    await admin.invalidateOtherSessions();
    await admin.updateLastLogin();
    const token = signToken(admin._id as string);

    if (rateLimitService.isConnected()) {
      await rateLimitService.resetRateLimit(ip, "adminLogin");
    }

    res.status(200).json({
      status: "success",
      token,
      data: {
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (err: any) {
    if (rateLimitService.isConnected()) {
      await rateLimitService.incrementFailedAttempt(ip, "adminLogin", 900);
    }
    console.error("Admin Login error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({});
    res.status(200).json({
      status: "success",
      results: users.length,
      data: { users },
    });
  } catch (err: any) {
    console.error("Get All Users error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }
    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (err: any) {
    console.error("Get User By ID error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }
    res.status(204).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (err: any) {
    console.error("Delete User error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export { adminLogin, getAllUsers, getUserById, deleteUser };