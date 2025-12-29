import { Router } from 'express';
import { getAllRoles } from '../controllers/role.controller.js';

export const roleRouter = Router();

roleRouter.get('/', getAllRoles);