import { Document, Model } from "mongoose";

export interface IUserBase {
  username: string;
  firstname: string;
  lastname: string;
  tempEmail?: string;
  dob?: Date;
  email: string;
  password: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  role: "user" | "admin" | "moderator";
  isActive: boolean;
  isDeactivated?: boolean;
  deactivationReason?: string;
  deactivatedAt?: Date;
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  loginAttempts: { ip: string; success: boolean; timestamp: Date }[];
  sessionVersion: number;
  createdAt: Date;
  updatedAt: Date;
  mfaEnabled?: boolean;
}

export interface IUserMethods {
  fullName: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<void>;
  createPasswordResetToken(): string;
  logLoginAttempt(ip: string, success: boolean): Promise<void>;
  invalidateOtherSessions(): Promise<void>;
  verifyMfaCode?(mfaCode: string): Promise<boolean>;
}

export type IUserDocument = IUserBase & Document & IUserMethods;

export type UserModel = Model<IUserDocument>;
