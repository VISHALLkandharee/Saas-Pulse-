"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_github2_1 = require("passport-github2");
const prisma_1 = __importDefault(require("./prisma"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:8000/api/auth/github/callback",
    scope: ["user:email"],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log(`[AUTH] GitHub login attempt for: ${profile.username}`);
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || profile.username || "GitHub User";
        const image = profile.photos?.[0]?.value;
        if (!email) {
            console.error(`[AUTH] GitHub login failed: No public email found for ${profile.username}`);
            return done(null, false, { message: "GitHub account must have a public email" });
        }
        // Find or Create user
        let user = await prisma_1.default.user.findUnique({
            where: { email },
            include: { subscription: true }
        });
        if (!user) {
            // If the schema requires a password, we generate a random one
            // In a perfect world, password would be optional in schema
            const randomPass = "OAUTH_USER_" + Math.random().toString(36).slice(-10);
            // 🚀 VIP Check: If user was invited via waitlist, they get PRO for free + isBeta tag
            const waitlistEntry = await prisma_1.default.waitlist.findUnique({ where: { email } });
            const isInvited = waitlistEntry?.status === "INVITED";
            user = await prisma_1.default.user.create({
                data: {
                    email,
                    name,
                    image,
                    Role: "USER",
                    password: randomPass,
                    isBeta: isInvited, // Auto-tag if invited
                    subscription: {
                        create: {
                            plan: isInvited ? "PRO" : "FREE",
                            status: "ACTIVE",
                            mrr: 0.0, // Beta users get PRO for $0
                        }
                    }
                },
                include: { subscription: true }
            });
            // Cleanup waitlist after registration
            if (waitlistEntry) {
                await prisma_1.default.waitlist.delete({ where: { email } }).catch(() => { });
            }
            user.isNewVip = isInvited; // Temporarily flag for the callback redirect
            // Log signup activity
            await prisma_1.default.activity.create({
                data: {
                    userId: user.id,
                    event: "USER_SIGNUP",
                    metadata: { method: "GITHUB" },
                },
            });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error, null);
    }
}));
// We don't strictly need serialize/deserialize if we are using JWT cookies,
// but passport expects them if session is true. We'll set session: false in the routes.
passport_1.default.serializeUser((user, done) => done(null, user.id));
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await prisma_1.default.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (error) {
        done(error, null);
    }
});
exports.default = passport_1.default;
