import jwt, { SignOptions } from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import sanitizeHtml from "sanitize-html";
import { Request, Response } from "express";
import User from "../models/user-model";
import OTP from "../models/otp-models";
import { IUserDocument } from "../types/userTypes";
import passwordResetTemplate from "../templates/passwordResetTemplate";
import registrationTemplate from "../templates/registrationTemplate";
import otpTemplate from "../templates/otpTemplate";
import {
  userSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  verifyOtpSchema,
} from "../validations/userValidation";
import rateLimitService from "../services/rateLimitService";
import { checkDisposableEmail } from "../services/emailValidationService";
import { checkCompromisedPassword } from "../services/passwordCheckService";
import dotenv from "dotenv";
import Joi from "joi";
import refreshTokenService from "../services/refreshTokenService";

// Extend Request type to include ip and user
declare module "express" {
  interface Request {
    ip?: string;
    user?: { id: string };
  }
}

dotenv.config();

/**
 * @module controllers/authController
 * @description Handles authentication-related operations with enhanced security
 */

/**
 * Validate environment variables
 */
type StringValue = `${number}${"ms" | "s" | "m" | "h" | "d" | "w" | "y"}`;

function isStringValue(value: string): value is StringValue {
  return /^\d+(ms|s|m|h|d|w|y)$/.test(value);
}

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const APP_URL = process.env.APP_URL || "http://localhost:9540";

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
 * Generate OTP
 * @private
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

/**
 * Register a new user with OTP verification
 */
const register = async (req: Request, res: Response): Promise<void> => {
  let ip = req.ip || "unknown";
  try {
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

    value.username = sanitizeHtml(value.username);
    value.email = sanitizeHtml(value.email);
    value.firstname = sanitizeHtml(value.firstname);
    value.lastname = sanitizeHtml(value.lastname);

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

    const user = new User({ ...value, isActive: false }) as IUserDocument; // Set isActive to false until OTP verified
    await user.save();

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await OTP.create({
      userId: user._id,
      code: otp,
      type: "registration",
      expiresAt: otpExpires,
    });

    const nameForTemplate =
      user.fullName || `${user.firstname} ${user.lastname}`.trim();
    const message = otpTemplate(otp, nameForTemplate);

    const transporter = createTransporter();
    try {
      await transporter.sendMail({
        from: '"Market Place" <no-reply@yourapp.com>',
        to: user.email,
        subject: "Verify Your Registration",
        html: message,
      });
    } catch (emailErr: any) {
      console.error("Email sending failed:", emailErr.message);
      // Rollback: remove any created OTPs and the user record
      await OTP.deleteMany({ userId: user._id, type: "registration" });
      await User.deleteOne({ _id: user._id });
      res.status(500).json({ status: "error", message: "Failed to send OTP" });
      return;
    }

    if (rateLimitService.isConnected()) {
      await rateLimitService.resetRateLimit(ip, "register");
    }

    res.status(201).json({
      status: "success",
      message:
        "Registration successful. OTP sent to your email. Please verify to activate your account.",
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err: any) {
    if (rateLimitService.isConnected()) {
      await rateLimitService.incrementFailedAttempt(ip, "register", 3600);
    }
    console.error("Register error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

/**
 * Refresh access token using a refresh token
 */
const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken) {
      res
        .status(400)
        .json({ status: "error", message: "refreshToken is required" });
      return;
    }
    const rotated = await refreshTokenService.verifyAndRotate(refreshToken);
    if (!rotated) {
      res
        .status(401)
        .json({ status: "error", message: "Invalid or expired refresh token" });
      return;
    }

    // Block refresh if user is deactivated
    const user = await User.findById(rotated.userId);
    if (!user) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }
    if ((user as any).isDeactivated) {
      res.status(403).json({
        status: "error",
        message: "Account is deactivated. Please login to reactivate.",
      });
      return;
    }

    const token = signToken(rotated.userId);
    res.status(200).json({
      status: "success",
      token,
      refreshToken: rotated.newRefreshToken,
      refreshTokenExpiresAt: rotated.expiresAt,
    });
  } catch (err: any) {
    console.error("Refresh error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

/**
 * Resend OTP for registration or email update
 */
const resendOtp = async (req: Request, res: Response): Promise<void> => {
  let ip = req.ip || "unknown";
  try {
    if (
      rateLimitService.isConnected() &&
      (await rateLimitService.isRateLimited(ip, "resendOtp", 3, 3600))
    ) {
      res.status(429).json({
        status: "error",
        message: "Too many OTP resend attempts. Try again later.",
      });
      return;
    }

    const { error, value } = Joi.object({
      userId: Joi.string().required(),
      type: Joi.string().valid("registration", "email-update").required(),
    }).validate(req.body, { abortEarly: false });
    if (error) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "resendOtp", 3600);
      }
      res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message),
      });
      return;
    }

    const { userId, type } = value as {
      userId: string;
      type: "registration" | "email-update";
    };

    const user = (await User.findById(userId)) as IUserDocument;
    if (!user) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "resendOtp", 3600);
      }
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    // Delete any existing OTP for this user and type
    await OTP.deleteMany({ userId, type });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await OTP.create({
      userId: user._id,
      code: otp,
      type,
      expiresAt: otpExpires,
    });

    const nameForTemplate =
      user.fullName || `${user.firstname} ${user.lastname}`.trim();
    const email =
      type === "email-update" ? user.tempEmail || user.email : user.email;
    const subject =
      type === "registration"
        ? "Verify Your Registration"
        : "Verify Your New Email";
    const message = otpTemplate(otp, nameForTemplate);

    const transporter = createTransporter();
    try {
      await transporter.sendMail({
        from: '"Market Place" <no-reply@yourapp.com>',
        to: email,
        subject,
        html: message,
      });
    } catch (emailErr: any) {
      console.error("Email sending failed:", emailErr.message);
      await OTP.deleteMany({ userId: user._id, type });
      res.status(500).json({ status: "error", message: "Failed to send OTP" });
      return;
    }

    if (rateLimitService.isConnected()) {
      await rateLimitService.resetRateLimit(ip, "resendOtp");
    }

    res.status(200).json({
      status: "success",
      message: "OTP resent successfully",
      data: { userId: user._id },
    });
  } catch (err: any) {
    if (rateLimitService.isConnected()) {
      await rateLimitService.incrementFailedAttempt(ip, "resendOtp", 3600);
    }
    console.error("ResendOtp error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

/**
 * Verify OTP for registration or email update
 */
const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ensure verifyOtpSchema allows userId, otp, and type
    const { error, value } = verifyOtpSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message),
      });
      return;
    }

    const { otp, userId, type } = value as {
      otp: string;
      userId: string;
      type: "registration" | "email-update";
    };
    const otpRecord = await OTP.findOne({
      userId,
      code: otp,
      type,
      expiresAt: { $gt: Date.now() },
    });

    if (!otpRecord) {
      res
        .status(400)
        .json({ status: "error", message: "Invalid or expired OTP" });
      return;
    }

    const user = (await User.findById(userId)) as IUserDocument;
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    if (type === "registration") {
      user.isActive = true;
      await user.save();
      const token = signToken(user._id as string);

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

      await OTP.deleteOne({ _id: otpRecord._id });

      res.status(200).json({
        status: "success",
        token,
        data: {
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
      });
    } else if (type === "email-update") {
      user.email = user.tempEmail || user.email;
      user.tempEmail = undefined;
      await user.save();
      await OTP.deleteOne({ _id: otpRecord._id });

      res.status(200).json({
        status: "success",
        data: {
          username: user.username,
          email: user.email,
          fullName: user.fullName,
        },
      });
    }
  } catch (err: any) {
    console.error("VerifyOtp error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

/**
 * Update user email with OTP verification
 */
const updateEmail = async (req: Request, res: Response): Promise<void> => {
  let ip = req.ip || "unknown";
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    if (
      rateLimitService.isConnected() &&
      (await rateLimitService.isRateLimited(ip, "updateEmail", 3, 3600))
    ) {
      res.status(429).json({
        status: "error",
        message: "Too many email update attempts. Try again later.",
      });
      return;
    }

    const { error, value } = Joi.object({
      email: Joi.string().email().required(),
    }).validate(req.body, { abortEarly: false });
    if (error) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "updateEmail", 3600);
      }
      res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message),
      });
      return;
    }

    const { email } = value;
    if (await checkDisposableEmail(email)) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "updateEmail", 3600);
      }
      res.status(400).json({
        status: "error",
        message: "Disposable email addresses are not allowed",
      });
      return;
    }

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "updateEmail", 3600);
      }
      res
        .status(400)
        .json({ status: "error", message: "Email already in use" });
      return;
    }

    const user = (await User.findById(userId)) as IUserDocument;
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    user.tempEmail = email;
    await user.save();

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await OTP.create({
      userId: user._id,
      code: otp,
      type: "email-update",
      expiresAt: otpExpires,
    });

    const nameForTemplate =
      user.fullName || `${user.firstname} ${user.lastname}`.trim();
    const message = otpTemplate(otp, nameForTemplate);

    const transporter = createTransporter();
    try {
      await transporter.sendMail({
        from: '"Market Place" <no-reply@yourapp.com>',
        to: email,
        subject: "Verify Your New Email",
        html: message,
      });
    } catch (emailErr: any) {
      console.error("Email sending failed:", emailErr.message);
      await OTP.deleteOne({ userId: user._id, type: "email-update" });
      user.tempEmail = undefined;
      await user.save();
      res.status(500).json({ status: "error", message: "Failed to send OTP" });
      return;
    }

    if (rateLimitService.isConnected()) {
      await rateLimitService.resetRateLimit(ip, "updateEmail");
    }

    res.status(200).json({
      status: "success",
      message: "OTP sent to new email for verification",
      data: { userId: user._id },
    });
  } catch (err: any) {
    if (rateLimitService.isConnected()) {
      await rateLimitService.incrementFailedAttempt(ip, "updateEmail", 3600);
    }
    console.error("UpdateEmail error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

/**
 * Login a user with enhanced security checks
 */
const login = async (req: Request, res: Response): Promise<void> => {
  let ip = req.ip || "unknown";
  try {
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
    const user = (await User.findOne(query).select(
      "+password"
    )) as IUserDocument | null;
    if (!user) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "login", 900);
      }
      res.status(401).json({ status: "error", message: "Invalid credentials" });
      return;
    }

    if (!(await user.comparePassword(password))) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(ip, "login", 900);
      }
      res.status(401).json({ status: "error", message: "Invalid credentials" });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        status: "error",
        message: "Please verify your OTP before you can login",
      });
      return;
    }

    // If user previously deactivated account, reactivate on successful login
    if (user.isDeactivated) {
      user.isDeactivated = false;
      user.deactivationReason = undefined;
      user.deactivatedAt = undefined;
      await user.save();
    }

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

    await user.logLoginAttempt(ip, true);
    await user.invalidateOtherSessions();
    await user.updateLastLogin();
    const token = signToken(user._id as string);
    const { refreshToken, expiresAt } = await refreshTokenService.issue(
      String(user._id)
    );

    if (rateLimitService.isConnected()) {
      await rateLimitService.resetRateLimit(ip, "login");
    }

    res.status(200).json({
      status: "success",
      token,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
      _id: user._id,
      data: {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err: any) {
    if (rateLimitService.isConnected()) {
      await rateLimitService.incrementFailedAttempt(ip, "login", 900);
    }
    console.error("Login error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
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

    const resetURL = `${APP_URL}/api/v1/auth/reset-password/${resetToken}`;
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
        .json({ status: "error", message: "Internal server error" });
      return;
    }

    res
      .status(200)
      .json({ status: "success", message: "Password reset email sent" });
  } catch (err: any) {
    console.error("ForgotPassword error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
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

    const token = signToken(user._id as string);
    // revoke all existing refresh tokens for security, and issue a fresh one
    await refreshTokenService.revokeAllForUser(String(user._id));
    const { refreshToken, expiresAt } = await refreshTokenService.issue(
      String(user._id)
    );

    res.status(200).json({
      status: "success",
      token,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
      data: {
        username: user.username,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (err: any) {
    console.error("ResetPassword error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

/**
 * Update user password
 */
const updatePassword = async (req: Request, res: Response): Promise<void> => {
  let ip = req.ip || "unknown";
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    if (
      rateLimitService.isConnected() &&
      (await rateLimitService.isRateLimited(ip, "updatePassword", 3, 3600))
    ) {
      res.status(429).json({
        status: "error",
        message: "Too many password update attempts. Try again later.",
      });
      return;
    }

    const { error, value } = updatePasswordSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(
          ip,
          "updatePassword",
          3600
        );
      }
      res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message),
      });
      return;
    }

    const { currentPassword, newPassword } = value as {
      currentPassword: string;
      newPassword: string;
    };

    const user = (await User.findById(userId).select(
      "+password"
    )) as IUserDocument;
    if (!user || !(await user.comparePassword(currentPassword))) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(
          ip,
          "updatePassword",
          3600
        );
      }
      res
        .status(401)
        .json({ status: "error", message: "Invalid current password" });
      return;
    }

    if (await checkCompromisedPassword(newPassword)) {
      if (rateLimitService.isConnected()) {
        await rateLimitService.incrementFailedAttempt(
          ip,
          "updatePassword",
          3600
        );
      }
      res.status(400).json({
        status: "error",
        message:
          "This password has been compromised in a data breach. Please choose a different password.",
      });
      return;
    }

    user.password = newPassword;
    await user.save();

    const nameForTemplate =
      user.fullName || `${user.firstname} ${user.lastname}`.trim();
    const message = `Dear ${nameForTemplate},\n\nYour password has been successfully updated. If you did not request this change, please contact support immediately.\n\nBest,\nMarket Place Team`;

    const transporter = createTransporter();
    try {
      await transporter.sendMail({
        from: '"Market Place" <no-reply@yourapp.com>',
        to: user.email,
        subject: "Password Updated",
        text: message,
      });
    } catch (emailErr: any) {
      console.error("Email sending failed:", emailErr.message);
    }

    if (rateLimitService.isConnected()) {
      await rateLimitService.resetRateLimit(ip, "updatePassword");
    }

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (err: any) {
    if (rateLimitService.isConnected()) {
      await rateLimitService.incrementFailedAttempt(ip, "updatePassword", 3600);
    }
    console.error("UpdatePassword error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

/**
 * Log out a user by revoking their refresh token(s)
 */
const logout = async (req: Request, res: Response): Promise<void> => {
  let ip = req.ip || "unknown";
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    if (
      rateLimitService.isConnected() &&
      (await rateLimitService.isRateLimited(ip, "logout", 5, 900))
    ) {
      res.status(429).json({
        status: "error",
        message: "Too many logout attempts. Try again later.",
      });
      return;
    }

    const { refreshToken, revokeAll } = req.body as {
      refreshToken?: string;
      revokeAll?: boolean;
    };

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    if (revokeAll) {
      // Revoke all refresh tokens for the user
      await refreshTokenService.revokeAllForUser(userId);
    } else if (refreshToken) {
      // Revoke a single refresh token
      await refreshTokenService.revoke(refreshToken);
    } else {
      res
        .status(400)
        .json({ status: "error", message: "refreshToken or revokeAll required" });
      return;
    }

    if (rateLimitService.isConnected()) {
      await rateLimitService.resetRateLimit(ip, "logout");
    }

    // Optional: Send confirmation email
    const nameForTemplate =
      user.fullName || `${user.firstname} ${user.lastname}`.trim();
    const message = `Dear ${nameForTemplate},\n\nYou have successfully logged out. If this was not you, please contact support immediately.\n\nBest,\nMarket Place Team`;

    const transporter = createTransporter();
    try {
      await transporter.sendMail({
        from: '"Market Place" <no-reply@yourapp.com>',
        to: user.email,
        subject: "Logout Confirmation",
        text: message,
      });
    } catch (emailErr: any) {
      console.error("Email sending failed:", emailErr.message);
      // Note: We don't fail the logout if email fails, as it's not critical
    }

    res.status(200).json({
      status: "success",
      message: revokeAll
        ? "Logged out from all sessions"
        : "Logged out successfully",
    });
  } catch (err: any) {
    if (rateLimitService.isConnected()) {
      await rateLimitService.incrementFailedAttempt(ip, "logout", 900);
    }
    console.error("Logout error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export {
  register,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyOtp,
  updateEmail,
  resendOtp,
  refresh,
  logout
};
