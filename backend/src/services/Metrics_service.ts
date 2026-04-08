import prisma from "../utils/prisma";
import redisClient from "../utils/redis";
import { getCache, setCache } from "../utils/redis";


export class MetricsService {
  /**
   * Returns dashboard stats for the founder.
   */
  /**
   * Returns dashboard stats for the user.
   * If the user is an ADMIN, they see aggregate system-wide stats.
   */
  static async getDashboardStats(userId: string, role: string) {
    if (role === "ADMIN") {
      return await MetricsService.getAdminStats();
    }
    return await MetricsService.getUserStats(userId, role);
  }

  /**
   * Returns aggregate system-wide stats for the ADMIN role.
   */
  static async getAdminStats() {
    const cacheKey = 'admin-stats:overall';
    const cachedStats = await getCache(cacheKey);
    if (cachedStats) return cachedStats;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Current Stats
    const [totalRevenue, activeCount, usersCount] = await Promise.all([
      prisma.subscription.aggregate({
        _sum: { mrr: true },
        where: { status: "ACTIVE" },
      }),
      prisma.subscription.count({
        where: { status: "ACTIVE" },
      }),
      prisma.user.count(),
    ]);

    const mrrValue = totalRevenue._sum?.mrr || 0;

    // 2. Historical Stats for Trends (30-60 days ago)
    const [prevTotalRevenue, prevActiveCount, prevUsersCount, cancelledThisMonth] = await Promise.all([
      prisma.subscription.aggregate({
        _sum: { mrr: true },
        where: { 
          status: "ACTIVE",
          createdAt: { lt: thirtyDaysAgo }
        },
      }),
      prisma.subscription.count({
        where: { 
          status: "ACTIVE",
          createdAt: { lt: thirtyDaysAgo }
        },
      }),
      prisma.user.count({ 
        where: { createdAt: { lt: thirtyDaysAgo } } 
      }),
      prisma.subscription.count({
        where: { 
          status: "CANCELLED",
          updatedAt: { gte: thirtyDaysAgo }
        }
      })
    ]);

    const prevMrrValue = prevTotalRevenue._sum?.mrr || 0;

    // 3. Admin Revenue History (Last 6 Months)
    const revenueHistory: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const histRevenue = await prisma.subscription.aggregate({
        _sum: { mrr: true },
        where: { 
          status: "ACTIVE",
          createdAt: { lte: monthEnd }
        }
      });
      revenueHistory.push({ month: monthName, revenue: histRevenue._sum?.mrr || 0 });
    }

    const result = {
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

    await setCache(cacheKey, result, 3600); // Cache for 1 hour
    return result;
  }

  /**
   * Returns stats for an individual founder.
   * Logic: Decouple "Platform Usage" from "Business Revenue".
   */
  static async getUserStats(userId: string, role: string) {
    const cacheKey = `user-stats:${userId}`;
    const cachedStats = await getCache(cacheKey);
    if (cachedStats) return cachedStats;

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const retentionDate = await MetricsService.getRetentionDate(userId, role);
    const subscription = await prisma.subscription.findUnique({ where: { userId } });

    // 1. SaaS Pulse Usage (Optimized Redis-first lookup)
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const usageKey = `usage:count:${userId}:${monthKey}`;
    let usageCountStr = await redisClient.get(usageKey);
    let usageCount: number;

    if (usageCountStr !== null) {
      usageCount = parseInt(usageCountStr);
    } else {
      // Fallback: Query Database and perform "Late Warming"
      usageCount = await prisma.activity.count({
        where: { 
          userId, 
          createdAt: { gte: startOfCurrentMonth },
          NOT: {
            event: { in: ["USER_SIGNUP", "USER_LOGIN"] }
          }
        }
      });
      // Warm the cache for future requests
      await redisClient.setEx(usageKey, 2592000, String(usageCount));
    }

    const plan = (subscription as any)?.plan || "FREE";
    const limits: Record<string, number> = { FREE: 1000, PRO: 50000, ENTERPRISE: 999999999 };
    const limit = limits[plan] || 1000; // Final safety fallback

    // 2. Business Pulses Aggregation
    const pulses = await prisma.activity.findMany({
      where: { userId, createdAt: { gte: retentionDate } },
      select: { event: true, metadata: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    let currentMonthMrr = 0;
    let prevMonthMrr = 0;
    const currentCustomerIds = new Set();
    const prevCustomerIds = new Set();
    let cancelledCount = 0;

    // 🕊️ Business Logic: Track the 'Latest State' of each customer to prevent double-counting
    const currentMonthCustomerMrr = new Map<string, number>();
    const prevMonthCustomerMrr = new Map<string, number>();

    pulses.forEach((p: any) => {
      // Exclude internal system events
      if (["USER_LOGIN", "USER_SIGNUP"].includes(p.event)) return;

      const meta = (p.metadata as any) || {};
      const val = meta.mrr || meta.amount || meta.value || 0;
      const amount = typeof val === 'number' ? val : (parseFloat(val) || 0);
      const custId = meta.customer || meta.customerId || meta.email || meta.userId;

      if (p.createdAt >= startOfCurrentMonth) {
        // Track unique identity if available
        if (custId) {
          currentCustomerIds.add(String(custId));
          currentMonthCustomerMrr.set(String(custId), amount);
        } else {
          // If no identity, still count the revenue as a guest pulse
          currentMonthMrr += amount;
        }

        if (p.event === "SUBSCRIPTION_CANCELLED" || p.event === "CHURN") cancelledCount++;
      } else if (p.createdAt >= startOfPrevMonth && p.createdAt < startOfCurrentMonth) {
        if (custId) {
          prevCustomerIds.add(String(custId));
          prevMonthCustomerMrr.set(String(custId), amount);
        } else {
          prevMonthMrr += amount;
        }
      }
    });

    // Sum up the deduplicated stateful MRR
    currentMonthCustomerMrr.forEach((val) => currentMonthMrr += val);
    prevMonthCustomerMrr.forEach((val) => prevMonthMrr += val);

    let apiKeyRecord = await prisma.apiKey.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Dynamic Revenue History
    const revenueHistory: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mName = d.toLocaleString('default', { month: 'short' });
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const mRev = pulses
        .filter((p: any) => p.createdAt >= mStart && p.createdAt <= mEnd)
        .reduce((sum: number, p: any) => {
          const m = (p.metadata as any) || {};
          const v = m.mrr || m.amount || m.value || 0;
          const a = typeof v === 'number' ? v : (parseFloat(v) || 0);
          return sum + (isNaN(a) ? 0 : a);
        }, 0);

      revenueHistory.push({ month: mName, revenue: Number(mRev.toFixed(2)) });
    }

    const result = {
      mrr: {
        value: Number(currentMonthMrr.toFixed(2)),
        trend: MetricsService.calculateTrend(currentMonthMrr, prevMonthMrr),
        label: "Your Business MRR",
      },
      activeSubscriptions: {
        value: currentCustomerIds.size,
        trend: MetricsService.calculateTrend(currentCustomerIds.size, prevCustomerIds.size),
        label: "Customers Tracked",
      },
      churnRate: {
        value: prevCustomerIds.size > 0 ? Number(((cancelledCount / prevCustomerIds.size) * 100).toFixed(1)) : 0,
        trend: 0,
        label: "Business Churn",
      },
      usage: {
        current: usageCount,
        limit: limit,
        percent: limit > 0 ? Math.min(Math.round((usageCount / limit) * 100), 100) : 0
      },
      apiKey: apiKeyRecord?.key || null,
      hasIntegrated: !!apiKeyRecord,
      revenueHistory,
    };

    await setCache(cacheKey, result, 3600); 
    return result;
  }

  /**
   * Returns a list of recent activities.
   */
  static async getRecentActivities(userId: string, role: string) {
    const isAdmin = role === "ADMIN";
    const activities = await prisma.activity.findMany({
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
      take: isAdmin ? 100 : 60, // Fetch a larger batch to account for hidden ones
    });

    // Filter out soft-deleted items before returning the exact requested amount
    const visibleActivities = activities.filter((a: any) => !(a.metadata?.hiddenFromFeed));

    return visibleActivities.slice(0, isAdmin ? 50 : 20).map((a: any) => {
      const isOwner = String(a.userId) === String(userId);
      let displayEmail = (a.user as any)?.email || "external@user.com";
      
      if (!isAdmin && !isOwner) {
        if (displayEmail.includes("@")) {
          const [name, domain] = displayEmail.split("@");
          displayEmail = `${name.charAt(0)}****@${domain}`;
        } else {
          displayEmail = "anonymous@pulse.com";
        }
      }

      return {
        id: a.id,
        userId: a.userId,
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
  static async deleteActivity(activityId: string, userId: string, role: string) {
    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new Error("Activity not found");
    if (role !== "ADMIN" && activity.userId !== userId) throw new Error("Unauthorized");
    
    const metadata = (activity.metadata as any) || {};
    metadata.hiddenFromFeed = true;

    return await prisma.activity.update({ 
      where: { id: activityId },
      data: { metadata }
    });
  }

  private static calculateTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  }

  private static formatActivityMessage(event: string, isOwner: boolean): string {
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

  private static async getRetentionDate(userId: string, role: string): Promise<Date> {
    if (role === "ADMIN") return new Date(0);
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    const plan = sub?.plan || "FREE";
    const date = new Date();
    if (plan === "FREE") date.setDate(date.getDate() - 7);
    else if (plan === "PRO") date.setDate(date.getDate() - 90);
    else return new Date(0);
    return date;
  }
}
