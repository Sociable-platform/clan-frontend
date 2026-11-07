import { useAuthStore } from '@/store';

/** Read-only view of the session for guards and the header. */
export function useAuthSession() {
  const status = useAuthStore((state) => state.status);
  const developer = useAuthStore((state) => state.developer);
  return { status, developer };
}
