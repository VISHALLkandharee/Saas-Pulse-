"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_controllers_1 = require("../controllers/User_controllers");
const Auth_Middleware_1 = require("../middlewares/Auth_Middleware");
const ValidateRequest_middleware_1 = require("../middlewares/ValidateRequest_middleware");
const Upload_middleware_1 = require("../middlewares/Upload_middleware");
const router = (0, express_1.Router)();
router.post("/register", Upload_middleware_1.upload.single("image"), (0, ValidateRequest_middleware_1.validateSchema)(ValidateRequest_middleware_1.registerSchema), User_controllers_1.registerUser);
router.post("/login", (0, ValidateRequest_middleware_1.validateSchema)(ValidateRequest_middleware_1.loginSchema), User_controllers_1.loginUser);
router.get("/profile", Auth_Middleware_1.authMiddleware, User_controllers_1.getprofile);
router.put("/profile", Auth_Middleware_1.authMiddleware, Upload_middleware_1.upload.single("image"), User_controllers_1.updateProfile);
router.post("/change-password", Auth_Middleware_1.authMiddleware, User_controllers_1.changePassword);
router.delete("/delete-account", Auth_Middleware_1.authMiddleware, User_controllers_1.deleteAccount);
router.get("/logout", User_controllers_1.logoutUser);
router.get("/refresh-token", User_controllers_1.refreshAccessToken);
//admin routes
router.get("/users", Auth_Middleware_1.authMiddleware, Auth_Middleware_1.authorizeAdmin, User_controllers_1.getallUsers);
exports.default = router;
