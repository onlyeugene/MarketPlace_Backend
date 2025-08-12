import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { IUserDocument } from "../types/userTypes"; // Reuse IUserDocument for simplicity, or define IAdminDocument if needed

const adminSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    firstname: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastname: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "moderator"],
      default: "admin",
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    loginAttempts: [
      {
        ip: String,
        success: Boolean,
        timestamp: Date,
      },
    ],
    sessionVersion: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

adminSchema.index({ role: 1 });

// Virtual
adminSchema.virtual("fullName").get(function (this: IUserDocument) {
  return `${this.firstname} ${this.lastname}`;
});

// Pre-save hook to hash password
adminSchema.pre("save", async function (this: IUserDocument, next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Pre-update hook
adminSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Methods
adminSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date();
  await this.save();
};

adminSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  return resetToken;
};

adminSchema.methods.logLoginAttempt = async function (
  ip: string,
  success: boolean
) {
  if (!this.loginAttempts) {
    this.loginAttempts = [];
  }
  this.loginAttempts.push({ ip, success, timestamp: new Date() });
  await this.save();
};

adminSchema.methods.invalidateOtherSessions = async function () {
  this.sessionVersion = (this.sessionVersion || 0) + 1;
  await this.save();
};

const Admin = mongoose.model<IUserDocument>("MarketPlaceAdmins", adminSchema);

export default Admin;