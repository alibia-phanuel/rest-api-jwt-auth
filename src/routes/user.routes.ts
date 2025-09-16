import { Router } from "express";
import { getCurrentUser } from "../controllers/userController";
import { ensureAuthenticated } from "../middlewares/authMiddleware";

const router = Router();
router.get("/current", ensureAuthenticated, getCurrentUser);

export default router;
