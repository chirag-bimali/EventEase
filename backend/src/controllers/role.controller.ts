import type { Request, Response } from "express";

import * as roleService from "../services/role.service.ts";

export const getAllRoles = async (req: Request, res: Response) => {
  try {
    const roles = await roleService.getAllRoles();
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};
