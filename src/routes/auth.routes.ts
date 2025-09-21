import { Router } from "express";
import {
  login,
  register,
  refreshToken,
  logout,
  qrcodeQr2faGenerate,
  validate2faGenerate,
  twoFa,
} from "../controllers/authController";
import { ensureAuthenticated } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/login/2fa", twoFa);
router.post("/refresh-token", refreshToken);
router.get("/logout", ensureAuthenticated, logout);
router.get("/2fa/generate", ensureAuthenticated, qrcodeQr2faGenerate);
router.post("/2fa/validate", ensureAuthenticated, validate2faGenerate);

export default router;
