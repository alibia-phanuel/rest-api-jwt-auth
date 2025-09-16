import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware";
import { findUserById } from "../models/userModel";

export const authorize =
  (roles: ("admin" | "moderator" | "user")[]) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!roles.includes(user.role as any)) {
      return res.status(403).json({ message: "Denied access" });
    }

    next();
  };
