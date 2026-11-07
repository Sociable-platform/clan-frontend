// The only place that reads import.meta.env. Everything else imports from here.
const rawPlatformUrl = import.meta.env.VITE_PLATFORM_URL;

// Local default matches the Platform service port; see .env.example.
const DEV_PLATFORM_URL = 'http://localhost:8081';

export const PLATFORM_URL = (
  rawPlatformUrl || (import.meta.env.DEV ? DEV_PLATFORM_URL : '')
).replace(/\/+$/, '');
