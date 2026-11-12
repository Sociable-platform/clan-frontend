import { create } from 'zustand';

import { clearStoredSession, writeStoredSession } from './authStorage';
import { ROLES } from './roles';

export const AUTH_STATUS = {
  // The session initializer has not finished; guards must not redirect yet.
  INITIALIZING: 'initializing',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
};

const SIGNED_OUT = { token: null, role: null, developer: null, admin: null };

// Auth session only. Backend data (games, API keys, ...) never goes in here.
// `role` says whose session this is; `developer` or `admin` holds that person's profile.
export const useAuthStore = create((set) => ({
  status: AUTH_STATUS.INITIALIZING,
  ...SIGNED_OUT,

  // Replaces whatever session was there: a developer logging in as admin (or back) does not log out first.
  startSession: ({ token, expiresAt, role = ROLES.DEVELOPER, developer = null, admin = null }) => {
    writeStoredSession({ token, expiresAt, role });
    set({ ...SIGNED_OUT, status: AUTH_STATUS.AUTHENTICATED, token, role, developer, admin });
  },

  clearSession: () => {
    clearStoredSession();
    set({ ...SIGNED_OUT, status: AUTH_STATUS.UNAUTHENTICATED });
  },

  // Signed out for this page load only; the stored token stays so a reload can retry
  // (used when the backend could not be reached while restoring).
  markUnauthenticated: () => {
    set({ ...SIGNED_OUT, status: AUTH_STATUS.UNAUTHENTICATED });
  },
}));
