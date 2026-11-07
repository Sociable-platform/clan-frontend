import { create } from 'zustand';

import { clearStoredSession, writeStoredSession } from './authStorage';

export const AUTH_STATUS = {
  // The session initializer has not finished; guards must not redirect yet.
  INITIALIZING: 'initializing',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
};

// Auth session only. Backend data (projects, versions, ...) never goes in here.
export const useAuthStore = create((set) => ({
  status: AUTH_STATUS.INITIALIZING,
  token: null,
  developer: null,

  startSession: ({ token, expiresAt, developer }) => {
    writeStoredSession({ token, expiresAt });
    set({ status: AUTH_STATUS.AUTHENTICATED, token, developer });
  },

  clearSession: () => {
    clearStoredSession();
    set({ status: AUTH_STATUS.UNAUTHENTICATED, token: null, developer: null });
  },

  // Signed out for this page load only; the stored token stays so a reload can retry
  // (used when the backend could not be reached while restoring).
  markUnauthenticated: () => {
    set({ status: AUTH_STATUS.UNAUTHENTICATED, token: null, developer: null });
  },
}));
