import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const exportSystemData = async (req: Request, res: Response) => {
  try {
    // Only ADMINs can reach this due to middleware, but we double check context
    const userRole = (req as any).user?.role;
    if (userRole !== "ADMIN") {
      return res.status(403).json({ message: "Unauthorized export request" });
    }

    // Fetch all activities with user emails
    const activities = await prisma.activity.findMany({
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
    const rows = activities.map(a => {
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

  } catch (error) {
    console.error("[ADMIN EXPORT] Failed:", error);
    res.status(500).json({ message: "Internal server error during export" });
  }
};
