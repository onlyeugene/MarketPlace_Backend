import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/user-model";

interface JwtPayload {
  id: string;
  // Add other expected properties here if needed
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload & { _id?: string };
    const userId = (payload as any).id || payload._id;
    if (!userId) {
      return res
        .status(403)
        .json({ status: "error", message: "Invalid token" });
    }

    const user = await User.findById(userId).select("_id isDeactivated");
    if (!user) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if ((user as any).isDeactivated) {
      return res.status(403).json({
        status: "error",
        message: "Account is deactivated. Please login to reactivate.",
      });
    }

    req.user = { id: String(user._id) };
    next();
  } catch (err) {
    return res.status(403).json({ status: "error", message: "Invalid token" });
  }
};
