import { Request, Response } from "express";
import User from "../models/user-model";
import { IUserDocument } from "../types/userTypes";
// import Joi from "joi";
// import { checkDisposableEmail } from "../services/emailValidationService";
import sanitizeHtml from "sanitize-html";
import { updateUserDetailsSchema } from "../validations/userValidation";

// Extend Request type to include ip and user with id from JWT
declare module "express" {
  interface Request {
    ip?: string;
    user?: { id: string };
  }
}

const updateUserDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const ip = req.ip || "unknown";
    const userId = req.params.id;

    if (!userId) {
      res.status(400).json({ status: "error", message: "User ID is required" });
      return;
    }

    if (req.user?.id !== userId) {
      console.log(
        "Mismatch: req.user.id =",
        req.user?.id,
        "vs userId =",
        userId
      );
      res.status(403).json({
        status: "error",
        message: "Forbidden: Cannot update another user's details",
      });
      return;
    }

    const { error, value } = updateUserDetailsSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      res.status(400).json({
        status: "error",
        message: error.details.map((detail) => detail.message),
      });
      return;
    }

    // Sanitize and normalize provided fields
    if (value.username) value.username = sanitizeHtml(value.username);
    if (value.firstname) value.firstname = sanitizeHtml(value.firstname);
    if (value.lastname) value.lastname = sanitizeHtml(value.lastname);
    if (value.phone) value.phone = sanitizeHtml(value.phone);
    if (value.address) {
      value.address.street = value.address.street
        ? sanitizeHtml(value.address.street)
        : value.address.street;
      value.address.city = value.address.city
        ? sanitizeHtml(value.address.city)
        : value.address.city;
      value.address.state = value.address.state
        ? sanitizeHtml(value.address.state)
        : value.address.state;
      value.address.country = value.address.country
        ? sanitizeHtml(value.address.country)
        : value.address.country;
      value.address.postalCode = value.address.postalCode
        ? sanitizeHtml(value.address.postalCode)
        : value.address.postalCode;
    }
    if (value.dob) value.dob = new Date(value.dob);

    const existingUser = value.username
      ? await User.findOne({
          $and: [{ _id: { $ne: userId } }, { username: value.username }],
        })
      : null;
    if (existingUser) {
      res
        .status(400)
        .json({ status: "error", message: "Username already in use" });
      return;
    }

    const user = (await User.findByIdAndUpdate(
      userId,
      { $set: value },
      { new: true, runValidators: true }
    )) as IUserDocument;
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        username: user.username,
        dob: user.dob,
        fullName: user.fullName,
      },
    });
  } catch (err: any) {
    console.error("UpdateUserDetails error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export { updateUserDetails };

// Get profile of the currently authenticated user
const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }

    const user = (await User.findById(userId)) as IUserDocument | null;
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        dob: user.dob,
        phone: user.phone,
        address: user.address,
        role: user.role,
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
      },
    });
  } catch (err: any) {
    console.error("GetMyProfile error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// Get another user's public profile by ID
const getUserProfileById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ status: "error", message: "User ID is required" });
      return;
    }

    const user = (await User.findById(id)) as IUserDocument | null;
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }

    res.status(200).json({
      status: "success",
      data: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        dob: user.dob,
      },
    });
  } catch (err: any) {
    console.error("GetUserProfileById error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export { getMyProfile, getUserProfileById };

// Deactivate account (auth required)
const deactivateAccount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }
    const reason =
      typeof req.body?.reason === "string"
        ? sanitizeHtml(req.body.reason)
        : undefined;
    const user = (await User.findById(userId)) as IUserDocument | null;
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }
    user.isDeactivated = true;
    user.deactivationReason = reason;
    user.deactivatedAt = new Date();
    await user.save();
    res.status(200).json({ status: "success", message: "Account deactivated" });
  } catch (err: any) {
    console.error("DeactivateAccount error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

// Delete account (auth required)
const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: "error", message: "Unauthorized" });
      return;
    }
    const user = (await User.findById(userId)) as IUserDocument | null;
    if (!user) {
      res.status(404).json({ status: "error", message: "User not found" });
      return;
    }
    await User.deleteOne({ _id: userId });
    res.status(200).json({ status: "success", message: "Account deleted" });
  } catch (err: any) {
    console.error("DeleteAccount error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export { deactivateAccount, deleteAccount };
