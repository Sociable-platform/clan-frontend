import { useAuthStore } from '@/store';

/** Read-only view of the session for guards and the header. */
export function useAuthSession() {
  const status = useAuthStore((state) => state.status);
  const role = useAuthStore((state) => state.role);
  const developer = useAuthStore((state) => state.developer);
  const admin = useAuthStore((state) => state.admin);
  return { status, role, developer, admin };
}
