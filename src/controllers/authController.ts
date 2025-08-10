import jwt, { SignOptions } from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import sanitizeHtml from "sanitize-html";
import { Request, Response } from "express";
import User from "../models/user-model";
import { IUserDocument } from "../types/userTypes";
import passwordResetTemplate from "../templates/passwordResetTemplate";
import registrationTemplate from "../templates/registrationTemplate";
import {
  userSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/userValidation";
import rateLimitService from "../services/rateLimitService";
import { checkDisposableEmail } from "../services/emailValidationService";
import { checkCompromisedPassword } from "../services/passwordCheckService";
import dotenv from "dotenv";

dotenv.config();

/**
 * @module controllers/authController
 * @description Handles authentication-related operations with enhanced security
 */

/**
 * Validate environment variables
 */
type StringValue = `${number}${'ms' | 's' | 'm' | 'h' | 'd' | 'w' | 'y'}`;

function isStringValue(value: string): value is StringValue {
  return /^\d+(ms|s|m|h|d|w|y)$/.test(value);
}


const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d"; // Default to '1d' if undefined
const APP_URL = process.env.APP_URL || "http://localhost:9540";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

/**
 * Generate JWT token
 * @private
 */
// const signToken = (id: string): string => {
//   // Default to '1d' if undefined or invalid
//   let expiresIn: StringValue | number = '1d';
  
//   if (JWT_EXPIRES_IN) {
//     if (isStringValue(JWT_EXPIRES_IN)) {
//       expiresIn = JWT_EXPIRES_IN;
//     } else if (!isNaN(Number(JWT_EXPIRES_IN))) {
//       expiresIn = Number(JWT_EXPIRES_IN);
//     }
//   }

//   const options: SignOptions = {
//     expiresIn,
//   };
//   return jwt.sign({ id }, JWT_SECRET, options);
// };

const signToken = (id: string): string => {
    const options: SignOptions = {
      expiresIn: JWT_EXPIRES_IN as StringValue,
    };
    return jwt.sign({ id }, JWT_SECRET, options);
  };
/**
 * Create nodemailer transporter
 */
const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      minVersion: "TLSv1.2",
    },
  });

/**
 * Register a new user with enhanced security checks
 */
const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = req.ip || "unknown"; // Fallback for undefined req.ip

    // Rate limit registration attempts if Redis is connected
    if (
      rateLimitService.isConnected() &&
      (await rateLimitService.isRateLimited(ip, "register", 5, 3600))
    ) {
      res.status(429).json({
        status: "error",
        message: "Too many registration attempts. Try again later.",
      });
      return;
    }

    // Validate request body
    const { error, value } = userSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "register", 3600);
      }
      res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message),
      });
      return;
    }

    // Sanitize inputs
    value.username = sanitizeHtml(value.username);
    value.email = sanitizeHtml(value.email);
    value.firstname = sanitizeHtml(value.firstname);
    value.lastname = sanitizeHtml(value.lastname);

    // Check for disposable email
    if (await checkDisposableEmail(value.email)) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "register", 3600);
      }
      res.status(400).json({
        status: "error",
        message: "Disposable email addresses are not allowed",
      });
      return;
    }

    // Check for compromised password
    if (await checkCompromisedPassword(value.password)) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "register", 3600);
      }
      res.status(400).json({
        status: "error",
        message:
          "This password has been compromised in a data breach. Please choose a different password.",
      });
      return;
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [{ username: value.username }, { email: value.email }],
    });
    if (existingUser) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "register", 3600);
      }
      res
        .status(400)
        .json({ status: "error", message: "Account already exists" });
      return;
    }

    // Create and save new user
    const user = new User(value) as IUserDocument;
    await user.save();
    const token = signToken(user._id as string); // Convert _id to string

    // Send welcome email
    const nameForTemplate =
      user.fullName || `${user.firstname} ${user.lastname}`.trim();
    const message = registrationTemplate(nameForTemplate);

    const transporter = createTransporter();
    try {
      await transporter.sendMail({
        from: '"Market Place" <no-reply@yourapp.com>',
        to: user.email,
        subject: "Registration Successful",
        text: `Welcome ${nameForTemplate}, your account has been created successfully!`,
        html: message,
      });
    } catch (emailErr: any) {
      console.error("Email sending failed:", emailErr.message);
    }

    // Reset rate limit on successful registration
    if (rateLimitService.isConnected()) {
      await rateLimitService.resetRateLimit(ip, "register");
    }

    res.status(201).json({
      status: "success",
      token,
      data: {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (err: any) {
    if (rateLimitService.isConnected()) {
      await rateLimitService.incrementFailedAttempt(
        req.ip || "unknown",
        "register",
        3600
      );
    }
    console.error("Register error:", err);
    res
      .status(400)
      .json({ status: "error", message: err.message || "Registration failed" });
  }
};

/**
 * Login a user with enhanced security checks
 */
const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = req.ip || "unknown"; // Fallback for undefined req.ip

    // Rate limit login attempts
    if (
      rateLimitService.isConnected() &&
      (await rateLimitService.isRateLimited(ip, "login", 5, 900))
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
        await rateLimitService.incrementFailedAttempt(ip, "login", 900);
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
        await rateLimitService.incrementFailedAttempt(ip, "login", 900);
      }
      res
        .status(400)
        .json({
          status: "error",
          message: "Identifier and password are required",
        });
      return;
    }

    // Sanitize identifier
    const sanitizedIdentifier = sanitizeHtml(identifier);

    // Check if identifier is a valid email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedIdentifier);
    const query = isEmail
      ? { email: sanitizedIdentifier }
      : { username: sanitizedIdentifier };
    const user = (await User.findOne(query).select(
      "+password"
    )) as IUserDocument | null;
    if (!user || !user.isActive || !(await user.comparePassword(password))) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "login", 900);
      }
      res.status(401).json({ status: "error", message: "Invalid credentials" });
      return;
    }

    // Check for MFA (if enabled)
    if (user.mfaEnabled && user.verifyMfaCode) {
      const mfaCode = (req.body.mfaCode as string) || "";
      if (!mfaCode || !(await user.verifyMfaCode(mfaCode))) {
        if (rateLimitService.isConnected()) {
          await rateLimitService.incrementFailedAttempt(ip, "login", 900);
        }
        res.status(401).json({ status: "error", message: "Invalid MFA code" });
        return;
      }
    }

    // Log IP address for security monitoring
    await user.logLoginAttempt(ip, true);

    // Invalidate previous sessions
    await user.invalidateOtherSessions();
    await user.updateLastLogin();
    const token = signToken(user._id as string); // Convert _id to string

    // Reset rate limit on successful login
    if (rateLimitService.isConnected()) {
      await rateLimitService.resetRateLimit(ip, "login");
    }

    res.status(200).json({
      status: "success",
      token,
      data: {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err: any) {
    if (rateLimitService.isConnected()) {
      await rateLimitService.incrementFailedAttempt(
        req.ip || "unknown",
        "login",
        900
      );
    }
    console.error("Login error:", err);
    res
      .status(400)
      .json({ status: "error", message: err.message || "Login failed" });
  }
};

/**
 * Send a password reset email
 */
const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message),
      });
      return;
    }

    const { email } = value as { email: string };
    const user = (await User.findOne({ email })) as IUserDocument | null;
    if (!user || !user.isActive) {
      res
        .status(404)
        .json({ status: "error", message: "No user found with that email" });
      return;
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${APP_URL}/api/auth/reset-password/${resetToken}`;
    const nameForTemplate =
      user.fullName || `${user.firstname} ${user.lastname}`.trim();
    const message = passwordResetTemplate(resetURL, nameForTemplate);

    const transporter = createTransporter();
    try {
      await transporter.sendMail({
        from: '"Market Place" <no-reply@yourapp.com>',
        to: user.email,
        subject: "Password Reset Request",
        html: message,
      });
    } catch (emailErr: any) {
      console.error("Email sending failed:", emailErr.message);
      res
        .status(500)
        .json({ status: "error", message: "Failed to send reset email" });
      return;
    }

    res
      .status(200)
      .json({ status: "success", message: "Password reset email sent" });
  } catch (err: any) {
    console.error("ForgotPassword error:", err);
    res
      .status(500)
      .json({ status: "error", message: "Failed to send reset email" });
  }
};

/**
 * Reset password using a token
 */
const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message),
      });
      return;
    }

    const tokenParam = String(req.params.token || "");
    if (!tokenParam) {
      res.status(400).json({ status: "error", message: "Token is required" });
      return;
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(tokenParam)
      .digest("hex");
    const user = (await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+password")) as IUserDocument | null;

    if (!user) {
      res
        .status(400)
        .json({ status: "error", message: "Invalid or expired token" });
      return;
    }

    const { password } = value as { password: string };

    if (await checkCompromisedPassword(password)) {
      res.status(400).json({
        status: "error",
        message:
          "This password has been compromised in a data breach. Please choose a different password.",
      });
      return;
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = signToken(user._id as string); // Convert _id to string

    res.status(200).json({
      status: "success",
      token,
      data: {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (err: any) {
    console.error("ResetPassword error:", err);
    res
      .status(400)
      .json({
        status: "error",
        message: err.message || "Failed to reset password",
      });
  }
};

export { register, login, forgotPassword, resetPassword };
