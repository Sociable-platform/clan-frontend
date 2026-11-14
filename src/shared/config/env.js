// The only place that reads import.meta.env. Everything else imports from here.
const rawPlatformUrl = import.meta.env.VITE_PLATFORM_URL;

// Local default matches the Platform service port; see .env.example.
const DEV_PLATFORM_URL = 'http://localhost:8081';

export const PLATFORM_URL = (
  rawPlatformUrl || (import.meta.env.DEV ? DEV_PLATFORM_URL : '')
).replace(/\/+$/, '');

// Where a suspended developer is told to write. Optional: without it the banner says "contact the
// Sociable team" with no address.
export const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL || '').trim();
