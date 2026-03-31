"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAdmin = void 0;
exports.authMiddleware = authMiddleware;
const jwt_1 = require("../utils/jwt");
async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = req.cookies.accessToken || (authHeader && authHeader.split(" ")[1]);
        if (!token) {
            if (req.cookies.refreshToken) {
                return res.status(401).json({ message: "Access token missing or expired", expired: true });
            }
            return res.status(401).json({ message: "Unauthorized" });
        }
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired", expired: true });
        }
        console.error("Failed Authenticating the user:", error);
        return res.status(401).json({ message: "Invalid token or failed authentication" });
    }
}
//admin middleware
const authorizeAdmin = (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== "ADMIN") { // Note: Payload has 'role', DB has 'Role'
            // The payload role comes from the token, which was generated with user.Role
            // In JWT utility, tokenPayload.role is lowercase. I will keep using lowercase 'role' here
            // but I should check if the payload mapping is correct.
            return res
                .status(403)
                .json({ message: "Forbidden: Admin access required" });
        }
        next();
    }
    catch (error) {
        return res.status(400).json({ message: "Only Role admin is required!" });
    }
};
exports.authorizeAdmin = authorizeAdmin;
