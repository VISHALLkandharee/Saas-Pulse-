import { Router } from "express";
import { getallUsers, getprofile, loginUser, logoutUser, updateProfile, refreshAccessToken, registerUser, changePassword, deleteAccount, githubAuthCallback, joinWaitlist } from "../controllers/User_controllers";
import { authMiddleware, authorizeAdmin } from "../middlewares/Auth_Middleware";
import { validateSchema, loginSchema, registerSchema, waitlistSchema, changePasswordSchema } from "../middlewares/ValidateRequest_middleware";
import { upload } from "../middlewares/Upload_middleware";
import passport from "../utils/Passport_config";

const router = Router();

// --- GITHUB OAUTH ROUTES ---
router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));

router.get(
  "/github/callback",
  (req, res, next) => {
    passport.authenticate("github", { session: false }, (err: any, user: any, info: any) => {
      const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
      if (err) {
        console.error("[AUTH] GitHub OAuth callback error:", err?.message || err);
        const isDbError = err?.message?.includes("not found") || err?.message?.includes("connect") || err?.code === "P1001";
        const message = isDbError
          ? "Unable to connect to the database. Please verify database status and try again."
          : "Authentication encountered an unexpected issue. Please try again.";
        return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(message)}`);
      }
      if (!user) {
        const errorMsg = info?.message || "auth_denied";
        return res.redirect(`${clientUrl}/login?error=${encodeURIComponent(errorMsg)}`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  githubAuthCallback
);

router.post("/register", upload.single("image"), validateSchema(registerSchema), registerUser);
router.post("/login", validateSchema(loginSchema), loginUser);
router.get("/profile", authMiddleware, getprofile);
router.put("/profile", authMiddleware, upload.single("image"), updateProfile);
router.post("/change-password", authMiddleware, validateSchema(changePasswordSchema), changePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);
router.post("/logout", logoutUser);
router.get("/refresh-token", refreshAccessToken);
router.post("/waitlist", validateSchema(waitlistSchema), joinWaitlist);

//admin routes
router.get("/users", authMiddleware, authorizeAdmin, getallUsers);

export default router;
