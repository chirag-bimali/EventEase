import type{ Request, Response } from 'express';

import * as roleService from '../services/role.service.js';

export const getAllRoles = async (req: Request, res: Response) => {
  const roles = await roleService.getAllRoles();
  res.json(roles);
}