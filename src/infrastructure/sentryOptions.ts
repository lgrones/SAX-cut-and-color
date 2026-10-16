import type { init } from '@sentry/astro';
import { SENTRY_DSN } from 'astro:env/client';

/**
 * Where the browser posts its reports, on our own domain so blockers let them
 * through
 */
export const SENTRY_TUNNEL = '/api/relay';

// Errors only, from the browser and the server alike, with nothing that
// identifies a visitor or the owner: no IP address, user, cookies, headers,
// query strings, request bodies or local variables. Without a DSN, or in dev,
// nothing is sent.
export const SENTRY_OPTIONS = {
  dsn: SENTRY_DSN,
  enabled: import.meta.env.PROD,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    stackFrameVariables: false,
  },
} satisfies Parameters<typeof init>[0];
