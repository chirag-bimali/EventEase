import { prisma } from "../lib/primsa.ts";

export interface RoleDTO {
  id: number;
  name: string;
}

/**
 * Fetch all roles with their IDs
 */
export async function getAllRoles(): Promise<RoleDTO[]> {
  try {
    const roles = await prisma.$queryRaw<RoleDTO[]>`
      SELECT id, name FROM Role
    `;

    return roles;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
}

/**
 * Fetch a role by ID
 */
export async function getRoleById(id: number): Promise<RoleDTO | null> {
  try {
    const role = await prisma.$queryRaw<RoleDTO[]>`
      SELECT id, name FROM Role WHERE id = ${id}
    `;
    if (role.length === 0) {
      return null;
    }
    
    return role[0] || null;
  } catch (error) {
    console.error("Error fetching role:", error);
    throw error;
  }
}
