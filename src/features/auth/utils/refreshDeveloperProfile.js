import { useAuthStore } from '@/store';

import { getCurrentDeveloper } from '../api/authApi';

/**
 * Asks the backend who the signed-in developer is now and puts the answer in the store. This is how
 * the dashboard learns why the account was suspended, or that an admin resumed it. Rejects if the
 * request fails; the store is then left as it was.
 */
export async function refreshDeveloperProfile() {
  const developer = await getCurrentDeveloper();
  useAuthStore.getState().setDeveloper(developer);
  return developer;
}
