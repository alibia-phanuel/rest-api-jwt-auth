import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  insertUser,
  findUserByEmail,
  User,
  findUserById,
} from "../models/userModel";
import jwt from "jsonwebtoken";
import config from "../config";

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

    const accessToken = jwt.sign(
      { userId: user._id }, // payload
      config.accessTokenSecret, // clé secrète
      { subject: "access Api", expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      user: { name: user.name, email: user.email },
      accessToken,
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
