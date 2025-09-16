import { Response } from "express";
import { findUserById } from "../models/userModel";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const getCurrentUser = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
