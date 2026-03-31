import { Router } from "express";
import { exportSystemData } from "../controllers/Admin_controllers";
import { authMiddleware, authorizeAdmin } from "../middlewares/Auth_Middleware";

const router = Router();

// Secure all admin routes with auth and role check
router.use(authMiddleware);
router.use(authorizeAdmin);

router.get("/export", exportSystemData);

export default router;
