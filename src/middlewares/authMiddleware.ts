import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import { userInvalidTokenSecre } from "../models/userModel";

// On étend Request pour pouvoir ajouter `user`
export interface AuthenticatedRequest extends Request {
  user?: { id: string };
  accessToken?: {
    value: string;
    exp: number;
  };
}

export const ensureAuthenticated = async (
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
  if (await userInvalidTokenSecre.findOne({ accessToken: token })) {
    return res.status(401).json({
      message: "Access token invalid",
      code: "access_token_invalid",
    });
  }
  try {
    const decoded = jwt.verify(token, config.accessTokenSecret) as {
      userId: string;
      exp: number;
    };

    req.accessToken = { value: token, exp: decoded.exp };
    req.user = { id: decoded.userId }; // ⚡ on garde l'id du user
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      error instanceof jwt.TokenExpiredError;
      return res.status(401).json({
        message: "Access token expired",
        code: "access_token_expired",
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      error instanceof jwt.JsonWebTokenError;
      return res.status(401).json({
        message: "Access token invalid",
        code: "access_token_invalid",
      });
    } else {
      return res.status(401).json({ message: "Access token invalid" });
    }
  }
};

