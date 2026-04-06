import { Router } from "express";
import { exportSystemData, getWaitlist, grantWaitlistAccess } from "../controllers/Admin_controllers";
import { authMiddleware, authorizeAdmin } from "../middlewares/Auth_Middleware";

const router = Router();

// Secure all admin routes with auth and role check
router.use(authMiddleware);
router.use(authorizeAdmin);

router.get("/export", exportSystemData);
router.get("/waitlist", getWaitlist);
router.post("/waitlist/invite", grantWaitlistAccess);

export default router;
