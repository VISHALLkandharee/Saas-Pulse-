import { Router } from "express";
import { getallUsers, getprofile, loginUser, logoutUser, updateProfile, refreshAccessToken, registerUser, changePassword, deleteAccount } from "../controllers/User_controllers";
import {authMiddleware, authorizeAdmin} from "../middlewares/Auth_Middleware";
import { validateSchema, loginSchema,registerSchema } from "../middlewares/ValidateRequest_middleware";
import { upload } from "../middlewares/Upload_middleware";
const router = Router();

router.post("/register", upload.single("image"), validateSchema(registerSchema), registerUser);
router.post("/login", validateSchema(loginSchema), loginUser);
router.get("/profile", authMiddleware, getprofile);
router.put("/profile", authMiddleware, upload.single("image"), updateProfile);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);
router.get("/logout", logoutUser);
router.get("/refresh-token", refreshAccessToken)

//admin routes
router.get("/users",authMiddleware, authorizeAdmin, getallUsers)


export default router;