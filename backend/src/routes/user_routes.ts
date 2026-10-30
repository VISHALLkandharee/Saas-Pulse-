import { Router } from "express";
import { getallUsers, getprofile, loginUser, logoutUser, updateProfile, refreshAccessToken, registerUser, changePassword, deleteAccount, githubAuthCallback, joinWaitlist } from "../controllers/User_controllers";
import {authMiddleware, authorizeAdmin} from "../middlewares/Auth_Middleware";
import { validateSchema, loginSchema,registerSchema, waitlistSchema } from "../middlewares/ValidateRequest_middleware";
import { upload } from "../middlewares/Upload_middleware";
import passport from "../utils/Passport_config";

const router = Router();

// --- GITHUB OAUTH ROUTES ---
router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));

router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_denied`, session: false }),
  githubAuthCallback
);

router.post("/register", upload.single("image"), validateSchema(registerSchema), registerUser);
router.post("/login", validateSchema(loginSchema), loginUser);
router.get("/profile", authMiddleware, getprofile);
router.put("/profile", authMiddleware, upload.single("image"), updateProfile);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);
router.get("/logout", logoutUser);
router.get("/refresh-token", refreshAccessToken)
router.post("/waitlist", validateSchema(waitlistSchema), joinWaitlist);

//admin routes
router.get("/users",authMiddleware, authorizeAdmin, getallUsers)


export default router;