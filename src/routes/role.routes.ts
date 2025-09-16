import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/authMiddleware";
import { authorize } from "../middlewares/roleMiddleware";
import { adminRoute, moderatorRoute } from "../controllers/roleController";

const router = Router();

router.get("/admin", ensureAuthenticated, authorize(["admin"]), adminRoute);
router.get(
  "/moderator",
  ensureAuthenticated,
  authorize(["admin", "moderator"]),
  moderatorRoute
);

export default router;
