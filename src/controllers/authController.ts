import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  insertUser,
  findUserByEmail,
  User,
  userRefreshTokenSecre,
  userInvalidTokenSecre,
  findUserById,
  users,
} from "../models/userModel";
import jwt from "jsonwebtoken";
import config from "../config";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import NodeCache from "node-cache";

const cache = new NodeCache();
export interface AuthenticatedRequest extends Request {
  user?: { id: string };
  accessToken?: { value: string; exp: number };
}
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ message: "All fields are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password or email" });
    }

    if (user["twoFaEnabled"]) {
      const tempToken = crypto.randomUUID();
      cache.set(
        tempToken + config.cachesTemporaryTokenPrefix,
        user._id,
        config.cachesTemporaryTokenExpiresIn
      );
      return res.status(200).json({
        tempToken,
        expireInSeconds: config.cachesTemporaryTokenExpiresIn,
      });
    } else {
      const accessToken = jwt.sign(
        { userId: user._id }, // payload
        config.accessTokenSecret, // clé secrète
        {
          subject: "access Api",
          expiresIn: config.refreshTokenExpiresIn,
        } as jwt.SignOptions
      );
      const refreshToken = jwt.sign(
        { userId: user._id },
        config.refreshTokenSecret,
        {
          subject: "refresh Api",
          expiresIn: config.refreshTokenExpiresIn,
        } as jwt.SignOptions
      );

      await userRefreshTokenSecre.insert({ userId: user._id, refreshToken });
      return res.status(200).json({
        message: "Login successful",
        user: { name: user.name, email: user.email },
        accessToken,
        refreshToken,
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const twoFa = async (req: Request, res: Response) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) {
      return res.status(422).json({ message: "All fields are required" });
    }
    const userId = cache.get(tempToken + config.cachesTemporaryTokenPrefix);
    if (!userId) {
      return res.status(400).json({ message: "Invalid temp token" });
    }
    const user = await users.findOne({ _id: userId });
    const verified = authenticator.check(code, user["twoFaSecret"]);
    if (!verified) {
      return res.status(400).json({ message: "Invalid code or expired" });
    }

    const accessToken = jwt.sign(
      { userId: user._id }, // payload
      config.accessTokenSecret, // clé secrète
      {
        subject: "access Api",
        expiresIn: config.refreshTokenExpiresIn,
      } as jwt.SignOptions
    );
    const refreshToken = jwt.sign(
      { userId: user._id },
      config.refreshTokenSecret,
      {
        subject: "refresh Api",
        expiresIn: config.refreshTokenExpiresIn,
      } as jwt.SignOptions
    );

    await userRefreshTokenSecre.insert({ userId: user._id, refreshToken });
    return res.status(200).json({
      message: "Login successful",
      user: { name: user.name, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(422).json({ message: "All fields are required" });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user: User = {
      name,
      email,
      password: hashPassword,
      role: role ?? "member",
      twoFaEnabled: false,
      twoFaSecret: null,
    };

    // ⚡ On récupère le user inséré avec son `_id`
    const newUser = await insertUser(user);

    return res.status(201).json({
      message: "User registered successfully",
      id: newUser._id, // ✅ Ici ça marche
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token not found" });
    }
    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret) as {
      userId: string;
    };
    const userRefresh = await userRefreshTokenSecre.findOne({
      refreshToken,
      userId: decoded.userId,
    });
    if (!userRefresh) {
      return res
        .status(401)
        .json({ message: "Invalid refresh token or expired" });
    }

    await userRefreshTokenSecre.remove({ _id: userRefresh._id });
    await userRefreshTokenSecre.compactDatafile();

    const accessToken = jwt.sign(
      { userId: decoded.userId }, // payload
      config.accessTokenSecret, // clé secrète
      {
        subject: "access Api",
        expiresIn: config.refreshTokenExpiresIn,
      } as jwt.SignOptions
    );
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      config.refreshTokenSecret,
      {
        subject: "refresh Api",
        expiresIn: config.refreshTokenExpiresIn,
      } as jwt.SignOptions
    );

    await userRefreshTokenSecre.insert({
      userId: decoded.userId,
      refreshToken: newRefreshToken,
    });
    return res.status(200).json({
      accessToken,
      refreshToken,
    });
    // const accessToken = jwt.sign(
    //   { userId: user.userId },
    //   config.accessTokenSecret,
    //   { subject: "access Api", expiresIn: "1h" }
    // );

    // return res.status(200).json({ accessToken });
  } catch (error: any) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return res
        .status(401)
        .json({ message: "Access token invalid or expired" });
    }
    return res.status(500).json({ message: error.message });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await userRefreshTokenSecre.removeMany({ userId: req.user?.id });
    await userRefreshTokenSecre.compactDatafile();
    await userInvalidTokenSecre.insert({
      accessToken: req.accessToken?.value ?? "",
      userId: req.user?.id ?? "",
      expirationDate: req.accessToken?.exp ?? 0,
    });
    return res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const qrcodeQr2faGenerate = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const user = await findUserById(req.user?.id ?? "");
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(
      user?.email ?? "",
      "alibia tech",
      secret
    );
    await users.updateOne(
      { _id: user?._id },
      { $set: { twoFaSecret: secret } }
    );
    await users.compactDatafile();

    const qrcode = await QRCode.toBuffer(otpAuthUrl, {
      type: "png",
      margin: 1,
    });
    res.setHeader("Content-Disposition", "attachment; filename=qrcode.png");
    res.status(200).type("image/png").send(qrcode);
    // return res.status(200).json({ secret, otpAuthUrl });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export const validate2faGenerate = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Code not found" });
    }
    const user = await findUserById(req.user?.id ?? "");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.twoFaSecret) {
      return res.status(400).json({ message: "2FA not enabled" });
    }
    const verified = authenticator.check(code, user.twoFaSecret);
    if (verified) {
      await users.updateOne(
        { _id: user._id },
        { $set: { twoFaEnabled: true } }
      );
      await users.compactDatafile();
      return res.status(200).json({ message: "2FA enabled" });
    } else {
      return res.status(400).json({ message: "Invalid 2FA code" });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
