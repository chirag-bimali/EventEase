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
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
      },
    });
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
    const role = await prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });
    return role;
  } catch (error) {
    console.error("Error fetching role:", error);
    throw error;
  }
}
