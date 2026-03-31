"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class MetricsService {
    /**
     * Returns dashboard stats for the founder.
     */
    /**
     * Returns dashboard stats for the user.
     * If the user is an ADMIN, they see aggregate system-wide stats.
     */
    static async getDashboardStats(userId, role) {
        if (role === "ADMIN") {
            return await MetricsService.getAdminStats();
        }
        return await MetricsService.getUserStats(userId, role);
    }
    /**
     * Returns aggregate system-wide stats for the ADMIN role.
     */
    static async getAdminStats() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // 1. Current Stats
        const [totalRevenue, activeCount, usersCount] = await Promise.all([
            prisma_1.default.subscription.aggregate({
                _sum: { mrr: true },
                where: { status: "ACTIVE" },
            }),
            prisma_1.default.subscription.count({
                where: { status: "ACTIVE" },
            }),
            prisma_1.default.user.count(),
        ]);
        const mrrValue = totalRevenue._sum?.mrr || 0;
        // 2. Historical Stats for Trends (30-60 days ago)
        const [prevTotalRevenue, prevActiveCount, prevUsersCount, cancelledThisMonth] = await Promise.all([
            prisma_1.default.subscription.aggregate({
                _sum: { mrr: true },
                where: {
                    status: "ACTIVE",
                    createdAt: { lt: thirtyDaysAgo }
                },
            }),
            prisma_1.default.subscription.count({
                where: {
                    status: "ACTIVE",
                    createdAt: { lt: thirtyDaysAgo }
                },
            }),
            prisma_1.default.user.count({
                where: { createdAt: { lt: thirtyDaysAgo } }
            }),
            prisma_1.default.subscription.count({
                where: {
                    status: "CANCELLED",
                    updatedAt: { gte: thirtyDaysAgo }
                }
            })
        ]);
        const prevMrrValue = prevTotalRevenue._sum?.mrr || 0;
        // 3. Admin Revenue History (Last 6 Months)
        const revenueHistory = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = d.toLocaleString('default', { month: 'short' });
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const histRevenue = await prisma_1.default.subscription.aggregate({
                _sum: { mrr: true },
                where: {
                    status: "ACTIVE",
                    createdAt: { lte: monthEnd }
                }
            });
            revenueHistory.push({ month: monthName, revenue: histRevenue._sum?.mrr || 0 });
        }
        return {
            mrr: {
                value: mrrValue,
                trend: MetricsService.calculateTrend(mrrValue, prevMrrValue),
                label: "System Total MRR",
            },
            activeSubscriptions: {
                value: activeCount,
                trend: MetricsService.calculateTrend(activeCount, prevActiveCount),
                label: "Total Paying Customers",
            },
            churnRate: {
                value: prevActiveCount > 0 ? (cancelledThisMonth / prevActiveCount) * 100 : 0,
                trend: 0,
                label: "System Churn Rate",
            },
            usersTotal: {
                value: usersCount,
                trend: MetricsService.calculateTrend(usersCount, prevUsersCount),
                label: "Total Registered Users",
            },
            revenueHistory,
        };
    }
    /**
     * Returns stats for an individual founder.
     * Logic: Decouple "Platform Usage" from "Business Revenue".
     */
    static async getUserStats(userId, role) {
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const retentionDate = await MetricsService.getRetentionDate(userId, role);
        const subscription = await prisma_1.default.subscription.findUnique({ where: { userId } });
        // 1. SaaS Pulse Usage
        const usageCount = await prisma_1.default.activity.count({
            where: { userId, createdAt: { gte: startOfCurrentMonth } }
        });
        const plan = subscription?.plan || "FREE";
        const limits = { FREE: 1000, PRO: 50000, ENTERPRISE: 999999999 };
        const limit = limits[plan];
        // 2. Business Pulses Aggregation
        const pulses = await prisma_1.default.activity.findMany({
            where: { userId, createdAt: { gte: retentionDate } },
            select: { event: true, metadata: true, createdAt: true }
        });
        let currentMonthMrr = 0;
        let prevMonthMrr = 0;
        const currentCustomerIds = new Set();
        const prevCustomerIds = new Set();
        let cancelledCount = 0;
        pulses.forEach((p) => {
            if (["USER_LOGIN", "USER_SIGNUP", "PLAN_UPGRADE"].includes(p.event))
                return;
            const meta = p.metadata || {};
            const val = meta.mrr || meta.amount || meta.value || 0;
            const amount = typeof val === 'number' ? val : (parseFloat(val) || 0);
            const custId = meta.customerId || meta.userId || meta.email;
            if (p.createdAt >= startOfCurrentMonth) {
                currentMonthMrr += amount;
                if (custId)
                    currentCustomerIds.add(String(custId));
                if (p.event === "SUBSCRIPTION_CANCELLED")
                    cancelledCount++;
            }
            else if (p.createdAt >= startOfPrevMonth && p.createdAt < startOfCurrentMonth) {
                prevMonthMrr += amount;
                if (custId)
                    prevCustomerIds.add(String(custId));
            }
        });
        const apiKeyRecord = await prisma_1.default.apiKey.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        // 3. Dynamic Revenue History
        const revenueHistory = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mName = d.toLocaleString('default', { month: 'short' });
            const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
            const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const mRev = pulses
                .filter(p => p.createdAt >= mStart && p.createdAt <= mEnd)
                .reduce((sum, p) => {
                const m = p.metadata || {};
                const v = m.mrr || m.amount || m.value || 0;
                return sum + (typeof v === 'number' ? v : (parseFloat(v) || 0));
            }, 0);
            revenueHistory.push({ month: mName, revenue: mRev });
        }
        return {
            mrr: {
                value: currentMonthMrr,
                trend: MetricsService.calculateTrend(currentMonthMrr, prevMonthMrr),
                label: "Your Business MRR",
            },
            activeSubscriptions: {
                value: currentCustomerIds.size,
                trend: MetricsService.calculateTrend(currentCustomerIds.size, prevCustomerIds.size),
                label: "Customers Tracked",
            },
            churnRate: {
                value: prevCustomerIds.size > 0 ? (cancelledCount / prevCustomerIds.size) * 100 : 0,
                trend: 0,
                label: "Business Churn",
            },
            usage: {
                current: usageCount,
                limit: limit,
                percent: Math.min(Math.round((usageCount / limit) * 100), 100)
            },
            apiKey: apiKeyRecord?.key || null,
            revenueHistory,
        };
    }
    /**
     * Returns a list of recent activities.
     */
    static async getRecentActivities(userId, role) {
        const isAdmin = role === "ADMIN";
        const activities = await prisma_1.default.activity.findMany({
            where: isAdmin ? {} : {
                OR: [
                    { userId },
                    {
                        AND: [
                            { event: { in: ["PLAN_UPGRADE", "USER_SIGNUP"] } },
                            { createdAt: { gte: await MetricsService.getRetentionDate(userId, role) } }
                        ]
                    }
                ]
            },
            include: { user: { select: { id: true, email: true } } },
            orderBy: { createdAt: "desc" },
            take: isAdmin ? 50 : 20,
        });
        return activities.map((a) => {
            const isOwner = String(a.userId) === String(userId);
            let displayEmail = a.user?.email || "external@user.com";
            if (!isAdmin && !isOwner) {
                if (displayEmail.includes("@")) {
                    const [name, domain] = displayEmail.split("@");
                    displayEmail = `${name.charAt(0)}****@${domain}`;
                }
                else {
                    displayEmail = "anonymous@pulse.com";
                }
            }
            return {
                id: a.id,
                event: a.event,
                timestamp: a.createdAt.toISOString(),
                message: MetricsService.formatActivityMessage(a.event, isOwner),
                userEmail: displayEmail,
                isOwner,
                metadata: a.metadata,
            };
        });
    }
    /**
     * Deletes a specific activity record with ownership check.
     */
    static async deleteActivity(activityId, userId, role) {
        const activity = await prisma_1.default.activity.findUnique({ where: { id: activityId } });
        if (!activity)
            throw new Error("Activity not found");
        if (role !== "ADMIN" && activity.userId !== userId)
            throw new Error("Unauthorized");
        return await prisma_1.default.activity.delete({ where: { id: activityId } });
    }
    static calculateTrend(current, previous) {
        if (previous === 0)
            return current > 0 ? 100 : 0;
        return Number(((current - previous) / previous * 100).toFixed(1));
    }
    static formatActivityMessage(event, isOwner) {
        if (isOwner) {
            switch (event) {
                case "USER_SIGNUP": return "You joined SaaS Pulse!";
                case "USER_LOGIN": return "You logged in.";
                case "PLAN_UPGRADE": return "You upgraded your plan!";
                default: return `Action recorded: ${event.replace(/_/g, " ")}`;
            }
        }
        switch (event) {
            case "USER_SIGNUP": return "A new founder just joined!";
            case "USER_LOGIN": return "A user logged in.";
            case "PLAN_UPGRADE": return "A user just upgraded to PRO! 🔥";
            default: return `System event: ${event.replace(/_/g, " ")}`;
        }
    }
    static async getRetentionDate(userId, role) {
        if (role === "ADMIN")
            return new Date(0);
        const sub = await prisma_1.default.subscription.findUnique({ where: { userId } });
        const plan = sub?.plan || "FREE";
        const date = new Date();
        if (plan === "FREE")
            date.setDate(date.getDate() - 7);
        else if (plan === "PRO")
            date.setDate(date.getDate() - 90);
        else
            return new Date(0);
        return date;
    }
}
exports.MetricsService = MetricsService;
