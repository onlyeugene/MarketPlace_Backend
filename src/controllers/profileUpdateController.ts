import { Request, Response } from "express";
import User from "../models/user-model";
import { IUserDocument } from "../types/userTypes";
import Joi from 'joi';
import { checkDisposableEmail } from "../services/emailValidationService";
import sanitizeHtml from "sanitize-html";
import { updateUserDetailsSchema } from "../validations/userValidation";

// Extend Request type to include ip and user with id from JWT
declare module "express" {
  interface Request {
    ip?: string;
    user?: { id: string };
  }
}


const updateUserDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = req.ip || "unknown";
    const userId = req.params.id;

    if (!userId) {
      res.status(400).json({ status: "error", message: "User ID is required" });
      return;
    }

    if (req.user?.id !== userId) {
      console.log("Mismatch: req.user.id =", req.user?.id, "vs userId =", userId);
      res.status(403).json({ status: "error", message: "Forbidden: Cannot update another user's details" });
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

    // Sanitize only provided fields
    if (value.username) value.username = sanitizeHtml(value.username);
    if (value.dob) value.dob = new Date(value.dob);

    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: userId } },
        { username: value.username },
      ],
    });
    if (existingUser) {
      res.status(400).json({ status: "error", message: "Username already in use" });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: value },
      { new: true, runValidators: true }
    ) as IUserDocument;
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