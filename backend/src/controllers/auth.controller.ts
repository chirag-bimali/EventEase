import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/primsa.ts";
import {
  hashPassword,
  verifyPassword,
  generateJWT,
} from "../services/auth.service.ts";
import { createUserSchema, loginUserSchema } from "../schemas/user.schema.ts";

// Store passwords as "salt:hash" so we can verify with the scrypt helper.

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Username, password, and role are required" });
    }

    const existingUser = await prisma.user.findFirst({ where: { username: parsed.data.username } });
    if (existingUser) {
      return res.status(409).json({ message: "Username already registered" });
    }

    const roleExists = await prisma.role.findUnique({ where: { id: parsed.data.roleId } });
    if (!roleExists) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const { hash, salt } = await hashPassword(parsed.data.password);

    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: parsed.data.username    ,
          password: `${salt}:${hash}`,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: parsed.data.roleId,
        },
      });

      return user;
    });

    return res
      .status(201)
      .json({ message: "User registered successfully", userId: created.id });
  } catch (error) {
    return next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = loginUserSchema.safeParse(req.body);

    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Username, password are required" });
    }

    const user = await prisma.user.findFirst({ where: { username: parsed.data.username } });
    if (!user || !user.password.includes(":")) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const [salt, storedHash] = user.password.split(":", 2);

    if (!storedHash || !salt) throw new Error("Invalid stored password format");

    const valid = await verifyPassword(parsed.data.password, storedHash, salt);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const userRole = await prisma.userRole.findFirst({
      where: { userId: user.id },
    });
    if (!userRole) {
      return res.status(403).json({ message: "User has no assigned role" });
    }

    const token = generateJWT(user.id, userRole.roleId);
    return res.status(200).json({ token });
  } catch (error) {
    return next(error);
  }
};
