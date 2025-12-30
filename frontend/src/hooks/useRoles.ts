// frontend/src/hooks/useRoles.ts
import { useEffect, useState } from "react";
import { getRoles} from "../services/role.service";
import type { Role } from "../types/role.types";

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getRoles();
        if (alive) setRoles(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { roles, loading, error };
}
