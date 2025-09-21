// 🔧 Fix avancé : global augmentation

// Si tu veux éviter de trimballer AuthenticatedRequest partout, tu peux faire un express.d.ts et fusionner le type de Request :

// src/types/express.d.ts
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string };
    accessToken?: {
      value: string;
      exp: number;
    };
  }
}
