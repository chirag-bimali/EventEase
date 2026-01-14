import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/primsa.ts";

/**
 * Middleware to check if the user has admin role
 * Must be used after authMiddleware
 */
export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    // Check if user has admin role
    const userWithRoles = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!userWithRoles) {
      return res.status(401).json({ message: "User not found" });
    }

    const isAdmin = userWithRoles.roles.some(
      (userRole) => userRole.role.name.toLowerCase() === "admin"
    );

    if (!isAdmin) {
      return res.status(403).json({
        message: "Forbidden - Admin access required",
      });
    }

    // Attach user data to request for use in controllers
    (req as any).user.roles = userWithRoles.roles.map((ur) => ur.role.name);

    next();
  } catch (error) {
    console.error("Error in adminAuthMiddleware:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
