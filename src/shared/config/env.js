// The only place that reads import.meta.env. Everything else imports from here.
const rawPlatformUrl = import.meta.env.VITE_PLATFORM_URL;

// Local default matches the Platform service port; see .env.example.
const DEV_PLATFORM_URL = 'http://localhost:8081';

export const PLATFORM_URL = (
  rawPlatformUrl || (import.meta.env.DEV ? DEV_PLATFORM_URL : '')
).replace(/\/+$/, '');

// The support address: on the Support page and in the banner a suspended developer sees.
// VITE_SUPPORT_EMAIL replaces it for a deployment with an address of its own.
const DEFAULT_SUPPORT_EMAIL = 'sociableplatform.support@gmail.com';

export const SUPPORT_EMAIL = (import.meta.env.VITE_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL).trim();

// An outside address for the documentation. Optional: without it the Docs links go to the guide
// built into Studio (/docs); set it only if the docs move to a site of their own.
export const DOCS_URL = (import.meta.env.VITE_DOCS_URL || '').trim();

/**
 * The addresses the documentation shows in its code samples: the hosted SDK and the three services
 * a game talks to. Each can be set on its own (VITE_SDK_URL, VITE_SOCIAL_URL, VITE_REALTIME_URL).
 * Without that they follow the Platform address: on the hosted platform the services are siblings
 * (platform.<host>, social.<host>, realtime.<host>, sdk.<host>), and locally they are the ports
 * of docker compose (the SDK's asset server is 18080).
 */
function siblingOf(platformUrl, name, localUrl) {
  const hosted = platformUrl.replace(/^(https?:\/\/)platform\./, `$1${name}.`);
  return hosted === platformUrl ? localUrl : hosted;
}

function serviceUrl(value, name, localUrl) {
  return ((value || '').trim() || siblingOf(PLATFORM_URL, name, localUrl)).replace(/\/+$/, '');
}

export const SERVICE_URLS = {
  platform: PLATFORM_URL || DEV_PLATFORM_URL,
  social: serviceUrl(import.meta.env.VITE_SOCIAL_URL, 'social', 'http://localhost:8082'),
  realtime: serviceUrl(import.meta.env.VITE_REALTIME_URL, 'realtime', 'http://localhost:8083'),
  sdk: serviceUrl(import.meta.env.VITE_SDK_URL, 'sdk', 'http://localhost:18080'),
};
