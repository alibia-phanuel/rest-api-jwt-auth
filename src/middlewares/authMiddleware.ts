import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";


// On étend Request pour pouvoir ajouter `user`
export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export const ensureAuthenticated = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Access token not found" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access token not found" });
  }

  try {
    const decoded = jwt.verify(token, config.accessTokenSecret) as {
      userId: string;
    };

    req.user = { id: decoded.userId }; // ⚡ on garde l'id du user
    next();
  } catch (error) {
    return res.status(401).json({ message: "Access token invalid or expired" });
  }
};
