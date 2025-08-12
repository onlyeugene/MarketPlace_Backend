import { Request, Response } from "express";
import Admin from "../models/admin-model";
import User from "../models/user-model";
import sanitizeHtml from "sanitize-html";
import rateLimitService from "../services/rateLimitService";
import {
  loginSchema,
  adminRegisterSchema,
} from "../validations/userValidation";
import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

type StringValue = `${number}${"ms" | "s" | "m" | "h" | "d" | "w" | "y"}`;

function isStringValue(value: string): value is StringValue {
  return /^\d+(ms|s|m|h|d|w|y)$/.test(value);
}

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

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

const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = adminRegisterSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message),
      });
      return;
    }

    const { username, firstname, lastname, email, password, role } = value;

    // Check for existing admin with same username or email
    const existingAdmin = await Admin.findOne({
      $or: [
        { username: sanitizeHtml(username) },
        { email: sanitizeHtml(email) },
      ],
    });
    if (existingAdmin) {
      res.status(400).json({
        status: "error",
        message: "Username or email already in use",
      });
      return;
    }

    // Check for existing user with same username or email to avoid conflicts
    const existingUser = await User.findOne({
      $or: [
        { username: sanitizeHtml(username) },
        { email: sanitizeHtml(email) },
      ],
    });
    if (existingUser) {
      res.status(400).json({
        status: "error",
        message: "Username or email already in use by a user",
      });
      return;
    }

    const admin = new Admin({
      username: sanitizeHtml(username),
      firstname: sanitizeHtml(firstname),
      lastname: sanitizeHtml(lastname),
      email: sanitizeHtml(email),
      password,
      role: role || "admin",
      isActive: true,
    });

    await admin.save();

    const token = signToken(admin._id as string);

    res.status(201).json({
      status: "success",
      token,
      data: {
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (err: any) {
    console.error("Admin Register error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
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
      res.status(400).json({
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
    const admin = await Admin.findOne(query).select("+password");

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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (page < 1 || limit < 1) {
      res.status(400).json({
        status: "error",
        message: "Page and limit must be positive integers",
      });
      return;
    }

    const totalCount = await User.countDocuments();
    const users = await User.find({})
      .skip(skip)
      .limit(limit)
      .select("username email fullName dob role isActive lastLogin");

    res.status(200).json({
      status: "success",
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      data: { users },
    });
  } catch (err: any) {
    console.error("Get All Users error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1;

    if (page < 1 || limit < 1) {
      res.status(400).json({
        status: "error",
        message: "Page and limit must be positive integers",
      });
      return;
    }

    const user = await User.findById(req.params.id).select(
      "username email fullName dob role isActive lastLogin"
    );
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    res.status(200).json({
      status: "success",
      totalCount: 1,
      page,
      limit,
      totalPages: 1,
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

export { registerAdmin, adminLogin, getAllUsers, getUserById, deleteUser };