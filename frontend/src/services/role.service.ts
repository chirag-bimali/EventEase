import axiosInstance from "../lib/axios";
import type { Role } from "../types/role.types";

export async function getRoles(): Promise<Role[]> {
  const response = await axiosInstance.get("/roles");
  return response.data;
}