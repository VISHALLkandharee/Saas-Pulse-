"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportSystemData = exports.grantWaitlistAccess = exports.getWaitlist = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const Email_service_1 = require("../services/Email_service");
const getWaitlist = async (req, res) => {
    try {
        const waitlist = await prisma_1.default.waitlist.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, waitlist });
    }
    catch (error) {
        console.error("[ADMIN WAITLIST] Fetch failed:", error);
        res.status(500).json({ message: "Failed to fetch waitlist" });
    }
};
exports.getWaitlist = getWaitlist;
const grantWaitlistAccess = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        // 1. Mark as INVITED in the database
        await prisma_1.default.waitlist.update({
            where: { email },
            data: { status: "INVITED" }
        });
        // 2. Trigger the real Resend invitation
        await Email_service_1.EmailService.sendInviteEmail(email);
        res.status(200).json({
            success: true,
            message: `Access granted! Invitation sent to ${email}`
        });
    }
    catch (error) {
        console.error("[ADMIN WAITLIST] Grant failed:", error);
        res.status(500).json({ message: "Failed to grant early access" });
    }
};
exports.grantWaitlistAccess = grantWaitlistAccess;
const exportSystemData = async (req, res) => {
    // ... existing export code ...
    try {
        // Only ADMINs can reach this due to middleware, but we double check context
        const userRole = req.user?.role;
        if (userRole !== "ADMIN") {
            return res.status(403).json({ message: "Unauthorized export request" });
        }
        // Fetch all activities with user emails
        const activities = await prisma_1.default.activity.findMany({
            include: {
                user: {
                    select: { email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        if (activities.length === 0) {
            return res.status(200).send("No data available for export");
        }
        // Generate CSV Content
        const headers = ["ID", "Timestamp", "Event", "Founder Email", "Metadata"];
        const rows = activities.map((a) => {
            const timestamp = a.createdAt.toISOString();
            const event = a.event;
            const email = a.user?.email || "external@user.com";
            const meta = JSON.stringify(a.metadata).replace(/"/g, '""'); // Escape quotes for CSV
            return `"${a.id}","${timestamp}","${event}","${email}","${meta}"`;
        });
        const csvContent = [headers.join(","), ...rows].join("\n");
        // Send as downloadable file
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=saas_pulse_export.csv');
        res.status(200).send(csvContent);
    }
    catch (error) {
        console.error("[ADMIN EXPORT] Failed:", error);
        res.status(500).json({ message: "Internal server error during export" });
    }
};
exports.exportSystemData = exportSystemData;
