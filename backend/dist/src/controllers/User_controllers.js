"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinWaitlist = exports.githubAuthCallback = exports.deleteAccount = exports.changePassword = exports.refreshAccessToken = exports.getallUsers = exports.logoutUser = exports.updateProfile = exports.getprofile = exports.loginUser = exports.registerUser = void 0;
const jwt_1 = require("../utils/jwt");
const prisma_1 = __importDefault(require("../utils/prisma"));
const Email_service_1 = require("../services/Email_service");
const registerUser = async (req, res) => {
    try {
        const { name, email, password, adminId, image: imageUrl } = req.body;
        console.log(`[AUTH] Register request from origin: ${req.headers.origin}`);
        // Use uploaded file path (Cloudinary URL). If local, prefix with / for static serving.
        let imagePath = imageUrl || null;
        if (req.file) {
            const p = req.file.path.replace(/\\/g, "/");
            imagePath = p.startsWith("http") ? p : `/${p}`;
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists with this email" });
        }
        // Determine role — compare securely to avoid undefined === undefined match
        let role = "USER";
        if (adminId && process.env.ADMIN_ID && adminId === process.env.ADMIN_ID) {
            role = "ADMIN";
        }
        const hashedPassword = await (0, jwt_1.hashPassword)(password);
        // 🚀 VIP Check: If user was invited via waitlist, they get PRO for free + isBeta tag
        const waitlistEntry = await prisma_1.default.waitlist.findUnique({ where: { email } });
        const isInvited = waitlistEntry?.status === "INVITED";
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                Role: role,
                image: imagePath,
                isBeta: isInvited, // Auto-tag if invited
                subscription: {
                    create: {
                        plan: isInvited ? "PRO" : "FREE",
                        status: "ACTIVE",
                        mrr: 0.0, // Beta users get PRO for $0
                    }
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                Role: true,
                createdAt: true,
            },
        });
        // Cleanup waitlist after registration
        if (waitlistEntry) {
            await prisma_1.default.waitlist.delete({ where: { email } }).catch(() => { });
        }
        // Log signup activity (Non-blocking)
        prisma_1.default.activity.create({
            data: {
                userId: user.id,
                event: "USER_SIGNUP",
                metadata: { welcome: true },
            },
        }).catch((err) => console.error("[AUTH] Activity log failed:", err));
        // Send Welcome Email (Non-blocking)
        Email_service_1.EmailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
            console.error("[EMAIL] Failed to send welcome email:", err);
        });
        // Generate tokens with correct functions and different secrets/expiries
        const accessToken = (0, jwt_1.generateAccessToken)({
            userId: user.id,
            email: user.email,
            role: user.Role,
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            userId: user.id,
            email: user.email,
            role: user.Role,
        });
        const accessTokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        };
        const refreshTokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        };
        return res
            .status(201)
            .cookie("accessToken", accessToken, accessTokenOptions)
            .cookie("refreshToken", refreshToken, refreshTokenOptions)
            .json({
            message: "User registered successfully",
            user,
            token: accessToken,
        });
    }
    catch (error) {
        console.error("Failed registering the user:", error);
        return res
            .status(500)
            .json({ message: "Internal server error while registering user" });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                Role: true,
                createdAt: true,
                password: true, // Need this for comparison
                subscription: true,
            },
        });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        const isPasswordValid = await (0, jwt_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" });
        }
        // Log login activity - only if no login activity exists in the last 2 hours (less spammy)
        const lastLoginActivity = await prisma_1.default.activity.findFirst({
            where: {
                userId: user.id,
                event: "USER_LOGIN",
                createdAt: {
                    gt: new Date(Date.now() - 2 * 60 * 60 * 1000)
                }
            }
        });
        if (!lastLoginActivity) {
            await prisma_1.default.activity.create({
                data: {
                    userId: user.id,
                    event: "USER_LOGIN",
                    metadata: { loginAt: new Date() },
                },
            });
        }
        const { password: _, ...userWithoutPassword } = user;
        const accessTokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        };
        const refreshTokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        };
        const accessToken = (0, jwt_1.generateAccessToken)({
            userId: user.id,
            email: user.email,
            role: user.Role,
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            userId: user.id,
            email: user.email,
            role: user.Role,
        });
        res
            .status(200)
            .cookie("accessToken", accessToken, accessTokenOptions)
            .cookie("refreshToken", refreshToken, refreshTokenOptions)
            .json({
            message: "User logged in successfully",
            user: userWithoutPassword,
            token: accessToken,
        });
    }
    catch (error) {
        console.error("Failed logging user in", error);
        res.status(500).json({ message: "Failed logging user in: " + error.message });
    }
};
exports.loginUser = loginUser;
const getprofile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                Role: true,
                createdAt: true,
                subscription: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            message: "User profile fetched successfully",
            user,
        });
    }
    catch (error) {
        console.error("Failed fetching user profile", error);
        res.status(500).json({ message: "Failed fetching user profile" });
    }
};
exports.getprofile = getprofile;
const logoutUser = async (req, res) => {
    try {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        };
        console.log("[AUTH] Initiating session flush for user...");
        // Nuclear flush: clear both tokens with specific options
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
        return res.status(200).json({ message: "Session flushed successfully" });
    }
    catch (error) {
        console.error("[AUTH] Logout error:", error);
        return res.status(200).json({ message: "Logout attempted" }); // Still return 200 to allow frontend redirect
    }
};
exports.logoutUser = logoutUser;
const getallUsers = async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                Role: true,
                createdAt: true,
                subscription: {
                    select: {
                        plan: true,
                        status: true,
                        mrr: true,
                    },
                },
            },
        });
        res.status(200).json({
            message: "Users fetched successfully",
            users,
        });
    }
    catch (error) {
        console.error("Failed getting all users", error);
        res.status(500).json({ message: "Failed getting all users" });
    }
};
exports.getallUsers = getallUsers;
const refreshAccessToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found" });
    }
    try {
        const decodedToken = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const user = await prisma_1.default.user.findUnique({
            where: { id: decodedToken.userId },
        });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        const accessToken = (0, jwt_1.generateAccessToken)({
            userId: user.id,
            email: user.email,
            role: user.Role,
        });
        const accessTokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        };
        res
            .status(200)
            .cookie("accessToken", accessToken, accessTokenOptions)
            .json({ message: "Access token refreshed successfully" });
    }
    catch (error) {
        console.error("Failed refreshing access token", error);
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Refresh token expired. Please login again." });
        }
        res.status(500).json({ message: "Failed refreshing access token" });
    }
};
exports.refreshAccessToken = refreshAccessToken;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { name } = req.body;
        let imagePath = undefined;
        if (req.file) {
            const p = req.file.path.replace(/\\/g, "/");
            imagePath = p.startsWith("http") ? p : `/${p}`;
        }
        const updateData = {};
        if (name)
            updateData.name = name;
        if (imagePath)
            updateData.image = imagePath;
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No fields provided to update" });
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                Role: true,
                createdAt: true,
            },
        });
        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("Failed updating profile", error);
        res.status(500).json({ message: "Failed updating profile" });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { currentPassword, newPassword } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const isMatch = await (0, jwt_1.comparePassword)(currentPassword, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Incorrect current password" });
        if (newPassword === currentPassword) {
            return res.status(400).json({ message: "New password cannot be the same as current password" });
        }
        const hashedPassword = await (0, jwt_1.hashPassword)(newPassword);
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        res.status(200).json({ message: "Password updated successfully" });
    }
    catch (error) {
        console.error("Failed changing password", error);
        res.status(500).json({ message: "Failed to change password" });
    }
};
exports.changePassword = changePassword;
const githubAuthCallback = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
        }
        const accessToken = (0, jwt_1.generateAccessToken)({
            userId: user.id,
            email: user.email,
            role: user.Role,
        });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            userId: user.id,
            email: user.email,
            role: user.Role,
        });
        const accessTokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 15 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        };
        const refreshTokenOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        };
        res.cookie("accessToken", accessToken, accessTokenOptions);
        res.cookie("refreshToken", refreshToken, refreshTokenOptions);
        // Redirect to dashboard on success
        if (user.isNewVip) {
            res.redirect(`${process.env.CLIENT_URL}/dashboard?new_vip=true`);
        }
        else {
            res.redirect(`${process.env.CLIENT_URL}/dashboard`);
        }
    }
    catch (error) {
        console.error("GitHub Auth Callback Error:", error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
};
exports.githubAuthCallback = githubAuthCallback;
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        console.log(`[AUTH] Initiating total account wipe for user: ${userId}`);
        // Perform a transaction to ensure all-or-nothing cleanup
        // We use deleteMany for related records because it won't throw an error if 0 records are found
        await prisma_1.default.$transaction([
            prisma_1.default.activity.deleteMany({ where: { userId } }),
            prisma_1.default.apiKey.deleteMany({ where: { userId } }),
            prisma_1.default.subscription.deleteMany({ where: { userId } }),
            prisma_1.default.user.delete({ where: { id: userId } }),
        ]);
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/",
        };
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
        res.status(200).json({ message: "Account deleted successfully" });
    }
    catch (error) {
        console.error("Failed deleting account", error);
        res.status(500).json({ message: "Failed to delete account" });
    }
};
exports.deleteAccount = deleteAccount;
const joinWaitlist = async (req, res) => {
    try {
        const { email } = req.body;
        // 1. Check if person is already a registered user
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "You are already a registered user! Please log in." });
        }
        // 2. Check if already on waitlist
        const onWaitlist = await prisma_1.default.waitlist.findUnique({ where: { email } });
        if (onWaitlist) {
            return res.status(400).json({ message: "You are already on our waitlist! We'll notify you soon." });
        }
        // 3. Add to waitlist
        await prisma_1.default.waitlist.create({
            data: { email }
        });
        res.status(201).json({
            message: "Success! You've been added to the private beta waitlist."
        });
    }
    catch (error) {
        console.error("[WAITLIST] Join failed:", error);
        res.status(500).json({ message: "Failed to join waitlist. Please try again later." });
    }
};
exports.joinWaitlist = joinWaitlist;
