import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";

export const adminRoute = (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({ message: "Only Admin can access this route" });
};

export const moderatorRoute = (req: AuthenticatedRequest, res: Response) => {
  return res
    .status(200)
    .json({ message: "Only Admin and Moderator can access this route" });
};
