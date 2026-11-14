import { PLATFORM_URL } from '@/shared/config';

import { createHttpClient } from './createHttpClient';
import { sessionBridge } from './session';

// The one HTTP client for the Platform API; features must not create their own.
export const platformClient = createHttpClient({
  baseUrl: PLATFORM_URL,
  getToken: sessionBridge.getToken,
  onUnauthorized: sessionBridge.onUnauthorized,
  onAccountSuspended: sessionBridge.onAccountSuspended,
});
